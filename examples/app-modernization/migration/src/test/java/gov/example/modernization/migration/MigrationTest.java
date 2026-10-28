package gov.example.modernization.migration;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class MigrationTest {

    private static final ZoneId UTC = ZoneOffset.UTC;

    private String legacy;

    @BeforeEach
    void setUp() throws SQLException {
        Fixtures.resetTarget();
        legacy = Fixtures.newLegacy("DB2", "/legacy/db2-schema.sql");
    }

    private Migrator.Result full() throws SQLException {
        return Migrator.run(Fixtures.config(legacy, null, UTC, false));
    }

    private Migrator.Result validateOnly() throws SQLException {
        return Migrator.run(Fixtures.config(legacy, null, UTC, true));
    }

    private static Object targetValue(String sql) throws SQLException {
        try (Connection c = DriverManager.getConnection(Fixtures.targetUrl(), "postgres", "");
                PreparedStatement ps = c.prepareStatement(sql);
                ResultSet rs = ps.executeQuery()) {
            rs.next();
            return rs.getObject(1);
        }
    }

    @Test
    void fullLoadThroughTheCliPassesEveryCheckAndWritesTheReport(@TempDir Path dir) throws Exception {
        Path report = dir.resolve("validation-report.json");
        int exit = MigrateCli.run(new String[] {
                "--source-url", legacy, "--source-user", "sa",
                "--target-url", Fixtures.targetUrl(), "--target-user", "postgres",
                "--batch-size", "7", "--report", report.toString()}, Map.of());

        assertThat(exit).isZero();
        String json = Files.readString(report, StandardCharsets.UTF_8);
        assertThat(json).contains("\"passed\": true", "\"mode\": \"full\"", "\"checksum_sha256\"",
                "\"aggregate\"", "\"row_count\"", "\"applicant\": 20", "\"case_record\": 50");
        assertThat(json).doesNotContain("Applicant-0001"); // keys and digests only, no row contents
        assertThat(targetValue("select count(*) from case_record")).isEqualTo(50L);
    }

    @Test
    void cliRefusesMissingArguments() {
        assertThat(MigrateCli.run(new String[] {"--source-url", legacy}, Map.of())).isEqualTo(2);
    }

    @Test
    void edgeCasesLandCorrectly() throws Exception {
        // The stand-in really does pad CHAR columns, so trimming is exercised.
        try (Connection c = DriverManager.getConnection(legacy, "sa", "");
                ResultSet rs = c.createStatement().executeQuery("SELECT CASE_NO FROM CASE_MSTR WHERE APPL_ID = 1")) {
            rs.next();
            assertThat(rs.getString(1)).isEqualTo("C-000001  ");
        }

        assertThat(full().report().passed()).isTrue();

        // Encoding: non-ASCII survives, padding removed.
        assertThat(targetValue("select last_name from applicant where id = 7")).isEqualTo("Peña-Applicant");
        assertThat(targetValue("select first_name from applicant where id = 13")).isEqualTo("Zoë");
        assertThat(targetValue("select max(length(case_number)) from case_record")).isEqualTo(8);
        // Sentinel date becomes NULL; a real closing date survives; status codes mapped.
        assertThat(targetValue("select closed_on from case_record where case_number = 'C-000002'")).isNull();
        assertThat(targetValue("select status from case_record where case_number = 'C-000002'")).isEqualTo("PENDING");
        assertThat(targetValue("select closed_on::text from case_record where case_number = 'C-000001'"))
                .isEqualTo("2024-02-03");
        assertThat(targetValue("select status from case_record where case_number = 'C-000001'")).isEqualTo("CLOSED");
        assertThat(targetValue("select count(*) from case_record where status <> 'CLOSED' and closed_on is not null"))
                .isEqualTo(0L);
        // Amounts with cents, the smallest and the largest DECIMAL(11,2).
        assertThat(targetValue("select amount_claimed from case_record where case_number = 'C-000001'"))
                .isEqualTo(new BigDecimal("1234.56"));
        assertThat(targetValue("select amount_claimed from case_record where case_number = 'C-000002'"))
                .isEqualTo(new BigDecimal("0.01"));
        assertThat(targetValue("select amount_claimed from case_record where case_number = 'C-000003'"))
                .isEqualTo(new BigDecimal("999999999.99"));
        // Legacy TIMESTAMP read as UTC wall-clock time, microseconds kept.
        assertThat(targetValue("select to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS.US')"
                + " from case_record where case_number = 'C-000001'")).isEqualTo("2026-02-02 01:07:13.001234");
    }

    @Test
    void theStatedSourceZoneIsApplied() throws Exception {
        Migrator.Result r = Migrator.run(Fixtures.config(legacy, null, ZoneId.of("America/New_York"), false));
        assertThat(r.report().passed()).isTrue();
        // 2026-02-02 01:07:13 in New York (EST, UTC-5) is 06:07:13 UTC.
        assertThat(targetValue("select to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD HH24:MI:SS')"
                + " from case_record where case_number = 'C-000001'")).isEqualTo("2026-02-02 06:07:13");
    }

    @Test
    void aChangedAmountFailsTheChecksumAndTheAggregate() throws Exception {
        full();
        Fixtures.execTarget("update case_record set amount_claimed = amount_claimed + 0.01 where case_number = 'C-000010'");

        ValidationReport report = validateOnly().report();
        assertThat(report.passed()).isFalse();
        assertThat(report.failures()).containsExactlyInAnyOrder("case_record/checksum_sha256", "case_record/aggregate");
        assertThat(detail(report, "case_record")).contains("differ 1 [C-000010]");
    }

    @Test
    void aDeletedRowFailsAllThreeChecks() throws Exception {
        full();
        Fixtures.execTarget("delete from case_record where case_number = 'C-000020'");

        ValidationReport report = validateOnly().report();
        assertThat(report.failures()).containsExactlyInAnyOrder(
                "case_record/row_count", "case_record/checksum_sha256", "case_record/aggregate");
        assertThat(detail(report, "case_record")).contains("missing from target 1 [C-000020]");
    }

    @Test
    void aTruncatedNameFailsOnlyTheChecksum() throws Exception {
        full();
        Fixtures.execTarget("update applicant set last_name = left(last_name, 5) where id = 7");

        ValidationReport report = validateOnly().report();
        // Counts and SUM(id) cannot see a text change; the checksum can.
        assertThat(report.failures()).containsExactly("applicant/checksum_sha256");
        assertThat(detail(report, "applicant")).contains("differ 1 [7]");
    }

    @Test
    void cliExitsNonZeroOnMismatch(@TempDir Path dir) throws Exception {
        full();
        Fixtures.execTarget("update case_record set case_type = 'XYZ' where case_number = 'C-000030'");
        int exit = MigrateCli.run(new String[] {"--source-url", legacy, "--source-user", "sa",
                "--target-url", Fixtures.targetUrl(), "--target-user", "postgres", "--validate-only",
                "--report", dir.resolve("r.json").toString()}, Map.of());
        assertThat(exit).isEqualTo(1);
        assertThat(Files.readString(dir.resolve("r.json"))).contains("\"passed\": false", "case_record/checksum_sha256");
    }

    @Test
    void deltaModeLoadsOnlyRowsChangedSinceTheWatermark() throws Exception {
        Migrator.Result first = full();
        Instant watermark = first.nextWatermark();
        assertThat(watermark).isNotNull();

        // Coexistence period: the legacy system keeps changing.
        Fixtures.exec(legacy, "sa", "UPDATE CASE_MSTR SET AMT_CLAIMED = AMT_CLAIMED + 5, STAT_CD = 'C',"
                + " CLOSE_DT = DATE '2026-10-15', LAST_UPD_TS = TIMESTAMP '2026-10-15 09:00:00'"
                + " WHERE RTRIM(CASE_NO) IN ('C-000011', 'C-000012')"); // H2 does not pad CHAR in comparisons
        Fixtures.exec(legacy, "sa", "INSERT INTO APPLICANT VALUES (21, 'Applicant-0021', 'Test', 'XA')");
        Fixtures.exec(legacy, "sa", "INSERT INTO CASE_MSTR VALUES ('C-000051', 21, 'ABC', 'O', DATE '2026-10-16',"
                + " DATE '0001-01-01', 42.00, TIMESTAMP '2026-10-16 08:00:00')");
        assertThat(validateOnly().report().passed()).isFalse(); // drift is visible before the delta

        Migrator.Result delta = Migrator.run(Fixtures.config(legacy, watermark, UTC, false));

        // The two changed rows, the new row, and the boundary row at the watermark itself (inclusive).
        assertThat(delta.loaded()).containsEntry("case_record", 4);
        assertThat(delta.report().passed()).isTrue();
        assertThat(delta.nextWatermark()).isEqualTo(Instant.parse("2026-10-16T08:00:00Z"));
        assertThat(targetValue("select status from case_record where case_number = 'C-000011'")).isEqualTo("CLOSED");
        assertThat(targetValue("select count(*) from case_record")).isEqualTo(51L);
    }

    @Test
    void rerunningIsIdempotent() throws Exception {
        Migrator.Result first = full();
        Migrator.Result second = full();

        assertThat(second.report().passed()).isTrue();
        assertThat(targetValue("select count(*) from applicant")).isEqualTo(20L);
        assertThat(targetValue("select count(*) from case_record")).isEqualTo(50L);
        assertThat(checksum(second.report(), "case_record")).isEqualTo(checksum(first.report(), "case_record"));
        assertThat(Migrator.toJson(second, Instant.EPOCH)).isEqualTo(Migrator.toJson(first, Instant.EPOCH));
    }

    @Test
    void oracleDialectStandInAlsoPasses() throws Exception {
        String oracle = Fixtures.newLegacy("Oracle", "/legacy/oracle-schema.sql");
        Migrator.Result r = Migrator.run(Fixtures.config(oracle, null, UTC, false));

        assertThat(r.report().failures()).isEmpty();
        assertThat(targetValue("select last_name from applicant where id = 7")).isEqualTo("Peña-Applicant");
        assertThat(targetValue("select closed_on from case_record where case_number = 'C-000002'")).isNull();
        assertThat(targetValue("select opened_on from case_record where case_number = 'C-000001'"))
                .hasToString(LocalDate.of(2024, 2, 2).toString());
    }

    @Test
    void canonicalFormIsStable() {
        Rows.CaseRecord c = new Rows.CaseRecord("C-000001", 1, "A|B", "OPEN", LocalDate.of(2026, 1, 2), null,
                new BigDecimal("12.5"), OffsetDateTime.parse("2026-01-02T03:04:05.123456789-05:00"));
        assertThat(Canonical.caseRecord(c))
                .isEqualTo("C-000001|1|A\\|B|OPEN|2026-01-02|\\N|12.50|2026-01-02T08:04:05.123456Z");
    }

    private static String detail(ValidationReport report, String table) {
        return report.tables().stream().filter(t -> t.table().equals(table)).findFirst().orElseThrow()
                .checks().stream().filter(c -> c.check().equals("checksum_sha256")).findFirst().orElseThrow()
                .detail();
    }

    private static String checksum(ValidationReport report, String table) {
        return report.tables().stream().filter(t -> t.table().equals(table)).findFirst().orElseThrow()
                .checks().stream().filter(c -> c.check().equals("checksum_sha256")).findFirst().orElseThrow()
                .target().get("sha256");
    }
}
