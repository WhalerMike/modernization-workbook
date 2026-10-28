package gov.example.modernization.migration;

import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Reads the legacy tables over plain JDBC and applies {@link Transform}. Only portable SQL is used
 * (no dialect functions), so the same code reads DB2, Oracle or the H2 stand-ins in the tests.
 */
public final class LegacySource {

    private final Connection conn;
    private final ZoneId zone;

    public LegacySource(Connection conn, ZoneId zone) {
        this.conn = conn;
        this.zone = zone;
    }

    /**
     * All applicants, or (delta mode) only those referenced by cases changed at or after the watermark.
     * The watermark is inclusive: re-loading the boundary row is harmless because loads are upserts.
     */
    public List<Rows.Applicant> applicants(LocalDateTime changedAfter) throws SQLException {
        String sql = "SELECT APPL_ID, LAST_NM, FIRST_NM, ST_CD FROM APPLICANT";
        if (changedAfter != null) {
            sql += " WHERE APPL_ID IN (SELECT APPL_ID FROM CASE_MSTR WHERE LAST_UPD_TS >= ?)";
        }
        List<Rows.Applicant> rows = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            bindWatermark(ps, changedAfter);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    rows.add(new Rows.Applicant(rs.getLong(1), Transform.text(rs.getString(2)),
                            Transform.text(rs.getString(3)), Transform.text(rs.getString(4))));
                }
            }
        }
        return rows;
    }

    /** All cases, or (delta mode) only those with LAST_UPD_TS at or after the watermark. */
    public List<Rows.CaseRecord> cases(LocalDateTime changedAfter) throws SQLException {
        String sql = "SELECT CASE_NO, APPL_ID, CASE_TYP_CD, STAT_CD, OPEN_DT, CLOSE_DT, AMT_CLAIMED, LAST_UPD_TS"
                + " FROM CASE_MSTR";
        if (changedAfter != null) {
            sql += " WHERE LAST_UPD_TS >= ?";
        }
        List<Rows.CaseRecord> rows = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            bindWatermark(ps, changedAfter);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String key = Transform.text(rs.getString(1));
                    rows.add(new Rows.CaseRecord(
                            key,
                            rs.getLong(2),
                            Transform.text(rs.getString(3)),
                            Transform.status(rs.getString(4), key),
                            Transform.date(localDate(rs, 5)),
                            Transform.date(localDate(rs, 6)),
                            Transform.amount(rs.getBigDecimal(7)),
                            Transform.timestamp(rs.getObject(8, LocalDateTime.class), zone)));
                }
            }
        }
        return rows;
    }

    /** The newest LAST_UPD_TS in the source: the watermark to pass as --since on the next delta run. */
    public LocalDateTime maxUpdated() throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement("SELECT MAX(LAST_UPD_TS) FROM CASE_MSTR");
                ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getObject(1, LocalDateTime.class);
        }
    }

    /** Independent aggregate, computed in the source database: count and SUM(APPL_ID). */
    public Map<String, String> applicantAggregate() throws SQLException {
        Map<String, String> out = new LinkedHashMap<>();
        try (PreparedStatement ps = conn.prepareStatement("SELECT COUNT(*), SUM(APPL_ID) FROM APPLICANT");
                ResultSet rs = ps.executeQuery()) {
            rs.next();
            out.put("count", Long.toString(rs.getLong(1)));
            out.put("sum_id", plain(rs.getBigDecimal(2), 0));
        }
        return out;
    }

    /**
     * Independent aggregate, computed in the source database: COUNT and SUM(AMT_CLAIMED) per status code.
     * The only shared logic with the load is the status-code name (O is reported as OPEN).
     */
    public Map<String, String> caseAggregate() throws SQLException {
        Map<String, String> out = new java.util.TreeMap<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "SELECT STAT_CD, COUNT(*), SUM(AMT_CLAIMED) FROM CASE_MSTR GROUP BY STAT_CD");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                String code = Transform.text(rs.getString(1));
                String status = Transform.STATUS_CODES.getOrDefault(code, "UNKNOWN(" + code + ")");
                out.put(status + ".count", Long.toString(rs.getLong(2)));
                out.put(status + ".sum_amount", plain(rs.getBigDecimal(3), 2));
            }
        }
        return out;
    }

    static String plain(BigDecimal b, int scale) {
        return b == null ? "0" : b.setScale(scale, java.math.RoundingMode.UNNECESSARY).toPlainString();
    }

    private void bindWatermark(PreparedStatement ps, LocalDateTime changedAfter) throws SQLException {
        if (changedAfter != null) {
            ps.setTimestamp(1, Timestamp.valueOf(changedAfter));
        }
    }

    /**
     * Reads a DATE as a LocalDate without passing through java.util.Date, whose calendar handling
     * shifts very old dates such as the 0001-01-01 sentinel. Falls back to LocalDateTime for drivers
     * that expose a DATE with a time of day (an Oracle DATE).
     */
    private static LocalDate localDate(ResultSet rs, int col) throws SQLException {
        try {
            return rs.getObject(col, LocalDate.class);
        } catch (SQLException e) {
            LocalDateTime dt = rs.getObject(col, LocalDateTime.class);
            return dt == null ? null : dt.toLocalDate();
        }
    }
}
