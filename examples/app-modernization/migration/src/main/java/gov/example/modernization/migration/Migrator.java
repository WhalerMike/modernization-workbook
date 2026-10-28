package gov.example.modernization.migration;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Loads the legacy tables into PostgreSQL in foreign-key order, then validates the whole of both sides. */
public final class Migrator {

    /**
     * @param since      null for a full load; otherwise only cases with LAST_UPD_TS at or after this instant
     *                   (and the applicants they reference) are loaded
     * @param sourceZone the zone the legacy TIMESTAMP values are wall-clock times in
     */
    public record Config(String sourceUrl, String sourceUser, String sourcePassword,
            String targetUrl, String targetUser, String targetPassword,
            ZoneId sourceZone, Instant since, int batchSize, boolean validateOnly) {
    }

    public record Result(Config config, Map<String, Integer> loaded, Instant nextWatermark, ValidationReport report) {
    }

    private Migrator() {
    }

    public static Result run(Config config) throws SQLException {
        try (Connection src = DriverManager.getConnection(config.sourceUrl(), config.sourceUser(), config.sourcePassword());
                Connection tgt = DriverManager.getConnection(config.targetUrl(), config.targetUser(), config.targetPassword())) {
            src.setReadOnly(true);
            LegacySource source = new LegacySource(src, config.sourceZone());
            TargetStore target = new TargetStore(tgt, config.batchSize());

            Map<String, Integer> loaded = new LinkedHashMap<>();
            if (!config.validateOnly()) {
                LocalDateTime watermark = config.since() == null ? null
                        : LocalDateTime.ofInstant(config.since(), config.sourceZone());
                List<Rows.Applicant> applicants = source.applicants(watermark);
                List<Rows.CaseRecord> cases = source.cases(watermark);
                tgt.setAutoCommit(false);
                try {
                    target.upsertApplicants(applicants); // parents first
                    target.upsertCases(cases);
                    tgt.commit();
                } catch (SQLException | RuntimeException e) {
                    tgt.rollback();
                    throw e;
                }
                tgt.setAutoCommit(true);
                loaded.put("applicant", applicants.size());
                loaded.put("case_record", cases.size());
            }
            LocalDateTime max = source.maxUpdated();
            Instant next = max == null ? null : max.atZone(config.sourceZone()).toInstant();
            return new Result(config, loaded, next, Validator.validate(source, target));
        }
    }

    public static String toJson(Result r, Instant generatedAt) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("generatedAt", generatedAt.atOffset(ZoneOffset.UTC).toString());
        root.put("mode", r.config().validateOnly() ? "validate-only" : r.config().since() == null ? "full" : "delta");
        root.put("since", r.config().since() == null ? null : r.config().since().toString());
        root.put("sourceZone", r.config().sourceZone().getId());
        root.put("nextWatermark", r.nextWatermark() == null ? null : r.nextWatermark().toString());
        root.put("loaded", r.loaded());
        root.put("passed", r.report().passed());
        root.put("failures", r.report().failures());
        root.put("tables", r.report().tables().stream().map(t -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("table", t.table());
            m.put("sourceTable", t.sourceTable());
            m.put("passed", t.passed());
            m.put("checks", t.checks().stream().map(c -> {
                Map<String, Object> cm = new LinkedHashMap<>();
                cm.put("check", c.check());
                cm.put("passed", c.passed());
                cm.put("source", c.source());
                cm.put("target", c.target());
                if (c.detail() != null) {
                    cm.put("detail", c.detail());
                }
                return cm;
            }).toList());
            return m;
        }).toList());
        return Json.write(root);
    }

    public static void writeReport(Result r, Path file) throws IOException {
        Files.writeString(file, toJson(r, Instant.now()), StandardCharsets.UTF_8);
    }
}
