package gov.example.modernization.migration;

import java.nio.file.Path;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;

/**
 * Command line entry point.
 *
 * <pre>
 * java -cp "legacy-migration.jar:postgresql.jar:&lt;source JDBC driver&gt;.jar" \
 *   gov.example.modernization.migration.MigrateCli \
 *   --source-url jdbc:db2://legacy-host:50000/CASEDB --source-user migrator \
 *   --target-url jdbc:postgresql://localhost:5432/cases --target-user cases \
 *   [--since 2026-10-01T00:00:00Z] [--source-zone UTC] [--batch-size 500] \
 *   [--report validation-report.json] [--validate-only]
 * </pre>
 *
 * Passwords come from the SOURCE_DB_PASSWORD and TARGET_DB_PASSWORD environment variables, never
 * from arguments (which show up in process lists and shell history).
 * Exit codes: 0 all checks passed, 1 a validation check failed, 2 usage or runtime error.
 */
public final class MigrateCli {

    private MigrateCli() {
    }

    public static void main(String[] args) {
        System.exit(run(args, System.getenv()));
    }

    static int run(String[] args, Map<String, String> env) {
        Map<String, String> opts = new HashMap<>();
        boolean validateOnly = false;
        for (int i = 0; i < args.length; i++) {
            String a = args[i];
            if (a.equals("--validate-only")) {
                validateOnly = true;
            } else if (a.startsWith("--") && i + 1 < args.length) {
                opts.put(a.substring(2), args[++i]);
            } else {
                return usage("Unexpected argument: " + a);
            }
        }
        if (!opts.containsKey("source-url") || !opts.containsKey("target-url")) {
            return usage("--source-url and --target-url are required");
        }
        try {
            Instant since = opts.containsKey("since") ? OffsetDateTime.parse(opts.get("since")).toInstant() : null;
            Migrator.Config config = new Migrator.Config(
                    opts.get("source-url"), opts.get("source-user"), env.get("SOURCE_DB_PASSWORD"),
                    opts.get("target-url"), opts.get("target-user"), env.get("TARGET_DB_PASSWORD"),
                    ZoneId.of(opts.getOrDefault("source-zone", "UTC")), since,
                    Integer.parseInt(opts.getOrDefault("batch-size", "500")), validateOnly);
            Migrator.Result result = Migrator.run(config);
            Path report = Path.of(opts.getOrDefault("report", "validation-report.json"));
            Migrator.writeReport(result, report);
            System.out.println("Loaded " + result.loaded() + "; next watermark " + result.nextWatermark());
            if (result.report().passed()) {
                System.out.println("Validation passed. Report: " + report.toAbsolutePath());
                return 0;
            }
            System.err.println("Validation FAILED: " + result.report().failures() + ". Report: " + report.toAbsolutePath());
            return 1;
        } catch (Exception e) {
            System.err.println("Migration error: " + e.getMessage());
            return 2;
        }
    }

    private static int usage(String message) {
        System.err.println(message);
        System.err.println("Usage: MigrateCli --source-url URL [--source-user U] --target-url URL [--target-user U]"
                + " [--since ISO-8601-instant] [--source-zone ZONE] [--batch-size N] [--report FILE] [--validate-only]");
        System.err.println("Passwords: SOURCE_DB_PASSWORD and TARGET_DB_PASSWORD environment variables.");
        return 2;
    }
}
