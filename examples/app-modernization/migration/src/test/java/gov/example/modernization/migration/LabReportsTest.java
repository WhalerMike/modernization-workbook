package gov.example.modernization.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * The developer workbook's labs: the same runs as MigrationTest, with their reports written to
 * target/lab/ so a reader can open them. Each report's generatedAt is pinned to the lab date, so
 * the files are the same on every run.
 *
 * <pre>
 * ./mvnw -q -pl migration test -Dtest=LabReportsTest
 * </pre>
 */
class LabReportsTest {

    static final Instant LAB_DATE = Instant.parse("2026-11-24T00:00:00Z");
    /** target/lab, or the folder -Dlab.dir names (the training labs put it in their run folder). */
    static final Path LAB = Path.of(System.getProperty("lab.dir", "target/lab"));

    private String legacy;

    @BeforeEach
    void setUp() throws Exception {
        Fixtures.resetTarget();
        legacy = Fixtures.newLegacy("DB2", "/legacy/db2-schema.sql");
        Files.createDirectories(LAB);
    }

    private Migrator.Result run(Instant since, boolean validateOnly) throws SQLException {
        return Migrator.run(Fixtures.config(legacy, since, ZoneId.of("UTC"), validateOnly));
    }

    private static void write(String name, Migrator.Result r) throws Exception {
        Files.writeString(LAB.resolve(name), Migrator.toJson(r, LAB_DATE), StandardCharsets.UTF_8);
    }

    /** Chapter 02: the full load, and the rows that show each transform rule. */
    @Test
    void fullLoadAndTheEdgeCases() throws Exception {
        Migrator.Result full = run(null, false);
        write("load-full.json", full);
        assertThat(full.report().passed()).isTrue();

        List<String> lines = new ArrayList<>();
        lines.add("table,key,column,legacy,target");
        try (Connection src = DriverManager.getConnection(legacy, "sa", "");
                Connection tgt = DriverManager.getConnection(Fixtures.targetUrl(), "postgres", "")) {
            for (String cn : List.of("C-000001", "C-000002", "C-000003")) {
                ResultSet s = src.createStatement().executeQuery(
                        "SELECT CASE_NO, STAT_CD, CLOSE_DT, AMT_CLAIMED, LAST_UPD_TS FROM CASE_MSTR WHERE RTRIM(CASE_NO) = '" + cn + "'");
                s.next();
                ResultSet t = tgt.createStatement().executeQuery(
                        "select case_number, status, closed_on::text, amount_claimed::text,"
                                + " to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.US\"Z\"')"
                                + " from case_record where case_number = '" + cn + "'");
                t.next();
                lines.add(row("case_record", cn, "case_number", "'" + s.getString(1) + "'", "'" + t.getString(1) + "'"));
                lines.add(row("case_record", cn, "status", s.getString(2), t.getString(2)));
                lines.add(row("case_record", cn, "closed_on", s.getString(3), t.getString(3) == null ? "NULL" : t.getString(3)));
                lines.add(row("case_record", cn, "amount_claimed", s.getBigDecimal(4).toPlainString(), t.getString(4)));
                lines.add(row("case_record", cn, "updated_at", s.getString(5), t.getString(5)));
            }
            for (int id : List.of(7, 13)) {
                ResultSet s = src.createStatement().executeQuery("SELECT LAST_NM, FIRST_NM FROM APPLICANT WHERE APPL_ID = " + id);
                s.next();
                ResultSet t = tgt.createStatement().executeQuery("select last_name, first_name from applicant where id = " + id);
                t.next();
                lines.add(row("applicant", String.valueOf(id), "last_name", "'" + s.getString(1) + "'", "'" + t.getString(1) + "'"));
                lines.add(row("applicant", String.valueOf(id), "first_name", "'" + s.getString(2) + "'", "'" + t.getString(2) + "'"));
            }
        }
        Files.write(LAB.resolve("edge-cases.csv"), lines, StandardCharsets.UTF_8);
    }

    /** Chapter 03: three kinds of damage, each caught by the checks that should catch it. */
    @Test
    void damageAndTheChecksThatCatchIt() throws Exception {
        run(null, false);
        Fixtures.execTarget("update case_record set amount_claimed = amount_claimed + 0.01 where case_number = 'C-000010'");
        Migrator.Result amount = run(null, true);
        write("damage-amount.json", amount);
        assertThat(amount.report().failures()).containsExactlyInAnyOrder("case_record/checksum_sha256", "case_record/aggregate");

        run(null, false);
        Fixtures.execTarget("delete from case_record where case_number = 'C-000020'");
        Migrator.Result deleted = run(null, true);
        write("damage-delete.json", deleted);
        assertThat(deleted.report().failures()).hasSize(3);

        run(null, false);
        Fixtures.execTarget("update applicant set last_name = left(last_name, 5) where id = 7");
        Migrator.Result truncated = run(null, true);
        write("damage-truncate.json", truncated);
        assertThat(truncated.report().failures()).containsExactly("applicant/checksum_sha256");
    }

    /** Chapter 03: the coexistence period, then a delta from the first run's watermark. */
    @Test
    void deltaFromTheWatermark() throws Exception {
        Migrator.Result first = run(null, false);
        write("delta-0-full.json", first);
        Fixtures.exec(legacy, "sa", "UPDATE CASE_MSTR SET AMT_CLAIMED = AMT_CLAIMED + 5, STAT_CD = 'C',"
                + " CLOSE_DT = DATE '2026-10-15', LAST_UPD_TS = TIMESTAMP '2026-10-15 09:00:00'"
                + " WHERE RTRIM(CASE_NO) IN ('C-000011', 'C-000012')");
        Fixtures.exec(legacy, "sa", "INSERT INTO APPLICANT VALUES (21, 'Applicant-0021', 'Test', 'XA')");
        Fixtures.exec(legacy, "sa", "INSERT INTO CASE_MSTR VALUES ('C-000051', 21, 'ABC', 'O', DATE '2026-10-16',"
                + " DATE '0001-01-01', 42.00, TIMESTAMP '2026-10-16 08:00:00')");
        Migrator.Result drift = run(null, true);
        write("delta-1-drift.json", drift);
        assertThat(drift.report().passed()).isFalse();
        Migrator.Result delta = run(first.nextWatermark(), false);
        write("delta-2-after.json", delta);
        assertThat(delta.report().passed()).isTrue();
    }

    private static String row(String table, String key, String column, String legacy, String target) {
        return String.join(",", table, key, column, csv(legacy), csv(target));
    }

    private static String csv(String v) {
        return v.contains(",") || v.contains("\"") ? "\"" + v.replace("\"", "\"\"") + "\"" : v;
    }
}
