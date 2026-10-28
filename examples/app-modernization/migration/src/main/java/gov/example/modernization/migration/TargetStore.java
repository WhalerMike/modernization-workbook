package gov.example.modernization.migration;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/** Writes to and reads from the PostgreSQL target (the service's Flyway-owned schema). */
public final class TargetStore {

    private static final String UPSERT_APPLICANT = """
            insert into applicant (id, last_name, first_name, state_code) values (?, ?, ?, ?)
            on conflict (id) do update set last_name = excluded.last_name, first_name = excluded.first_name,
                                           state_code = excluded.state_code
            """;

    private static final String UPSERT_CASE = """
            insert into case_record (case_number, applicant_id, case_type, status, opened_on, closed_on,
                                     amount_claimed, updated_at)
            values (?, ?, ?, ?, ?, ?, ?, ?)
            on conflict (case_number) do update set applicant_id = excluded.applicant_id,
                case_type = excluded.case_type, status = excluded.status, opened_on = excluded.opened_on,
                closed_on = excluded.closed_on, amount_claimed = excluded.amount_claimed,
                updated_at = excluded.updated_at
            """;

    private final Connection conn;
    private final int batchSize;

    public TargetStore(Connection conn, int batchSize) {
        this.conn = conn;
        this.batchSize = batchSize;
    }

    public void upsertApplicants(List<Rows.Applicant> rows) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(UPSERT_APPLICANT)) {
            int n = 0;
            for (Rows.Applicant a : rows) {
                ps.setLong(1, a.id());
                ps.setString(2, a.lastName());
                ps.setString(3, a.firstName());
                ps.setString(4, a.stateCode());
                ps.addBatch();
                if (++n % batchSize == 0) {
                    ps.executeBatch();
                }
            }
            ps.executeBatch();
        }
    }

    public void upsertCases(List<Rows.CaseRecord> rows) throws SQLException {
        try (PreparedStatement ps = conn.prepareStatement(UPSERT_CASE)) {
            int n = 0;
            for (Rows.CaseRecord c : rows) {
                ps.setString(1, c.caseNumber());
                ps.setLong(2, c.applicantId());
                ps.setString(3, c.caseType());
                ps.setString(4, c.status());
                ps.setObject(5, c.openedOn());
                ps.setObject(6, c.closedOn());
                ps.setBigDecimal(7, c.amountClaimed());
                ps.setObject(8, c.updatedAt());
                ps.addBatch();
                if (++n % batchSize == 0) {
                    ps.executeBatch();
                }
            }
            ps.executeBatch();
        }
    }

    public List<Rows.Applicant> applicants() throws SQLException {
        List<Rows.Applicant> rows = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "select id, last_name, first_name, state_code from applicant");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                rows.add(new Rows.Applicant(rs.getLong(1), rs.getString(2), rs.getString(3), rs.getString(4)));
            }
        }
        return rows;
    }

    public List<Rows.CaseRecord> cases() throws SQLException {
        List<Rows.CaseRecord> rows = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement("select case_number, applicant_id, case_type, status,"
                + " opened_on, closed_on, amount_claimed, updated_at from case_record");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                rows.add(new Rows.CaseRecord(rs.getString(1), rs.getLong(2), rs.getString(3), rs.getString(4),
                        rs.getObject(5, LocalDate.class), rs.getObject(6, LocalDate.class), rs.getBigDecimal(7),
                        rs.getObject(8, OffsetDateTime.class)));
            }
        }
        return rows;
    }

    /** Independent aggregate, computed in PostgreSQL. */
    public Map<String, String> applicantAggregate() throws SQLException {
        Map<String, String> out = new LinkedHashMap<>();
        try (PreparedStatement ps = conn.prepareStatement("select count(*), sum(id) from applicant");
                ResultSet rs = ps.executeQuery()) {
            rs.next();
            out.put("count", Long.toString(rs.getLong(1)));
            out.put("sum_id", LegacySource.plain(rs.getBigDecimal(2), 0));
        }
        return out;
    }

    /** Independent aggregate, computed in PostgreSQL: count and sum(amount_claimed) per status. */
    public Map<String, String> caseAggregate() throws SQLException {
        Map<String, String> out = new TreeMap<>();
        try (PreparedStatement ps = conn.prepareStatement(
                "select status, count(*), sum(amount_claimed) from case_record group by status");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                out.put(rs.getString(1) + ".count", Long.toString(rs.getLong(2)));
                out.put(rs.getString(1) + ".sum_amount", LegacySource.plain(rs.getBigDecimal(3), 2));
            }
        }
        return out;
    }
}
