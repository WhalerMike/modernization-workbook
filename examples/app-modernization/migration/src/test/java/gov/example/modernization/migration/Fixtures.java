package gov.example.modernization.migration;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;

import org.flywaydb.core.Flyway;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/**
 * Test fixtures. Source: H2 in DB2 (or Oracle) compatibility mode, a stand-in for the real engines.
 * Target: a real PostgreSQL server (Zonky embedded binaries) with the service's own Flyway V1 applied.
 */
final class Fixtures {

    private static EmbeddedPostgres postgres;

    private Fixtures() {
    }

    static synchronized String targetUrl() {
        if (postgres == null) {
            try {
                postgres = EmbeddedPostgres.builder().start();
            } catch (IOException e) {
                throw new UncheckedIOException(e);
            }
        }
        return postgres.getJdbcUrl("postgres", "postgres");
    }

    /** Drops everything in the target and applies the service's Flyway migrations from service/src/main/resources. */
    static void resetTarget() {
        String location = System.getProperty("target.schema.location");
        if (location == null) {
            throw new IllegalStateException("target.schema.location is not set (run the tests through Maven)");
        }
        Flyway flyway = Flyway.configure()
                .dataSource(targetUrl(), "postgres", "")
                .locations(location)
                .cleanDisabled(false)
                .load();
        flyway.clean();
        flyway.migrate();
    }

    /** A fresh in-memory legacy database in the given H2 compatibility mode, with the schema and seed loaded. */
    static String newLegacy(String mode, String schemaResource) throws SQLException {
        String url = "jdbc:h2:mem:legacy-" + UUID.randomUUID() + ";MODE=" + mode + ";DB_CLOSE_DELAY=-1";
        try (Connection c = DriverManager.getConnection(url, "sa", "")) {
            runScript(c, schemaResource);
            runScript(c, "/legacy/seed.sql");
        }
        return url;
    }

    static Migrator.Config config(String sourceUrl, Instant since, ZoneId zone, boolean validateOnly) {
        return new Migrator.Config(sourceUrl, "sa", "", targetUrl(), "postgres", "", zone, since, 7, validateOnly);
    }

    static void exec(String url, String user, String sql) throws SQLException {
        try (Connection c = DriverManager.getConnection(url, user, ""); Statement s = c.createStatement()) {
            s.execute(sql);
        }
    }

    static void execTarget(String sql) throws SQLException {
        exec(targetUrl(), "postgres", sql);
    }

    private static void runScript(Connection c, String resource) throws SQLException {
        String script;
        try (InputStream in = Fixtures.class.getResourceAsStream(resource)) {
            script = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        StringBuilder sql = new StringBuilder();
        try (Statement s = c.createStatement()) {
            for (String line : script.split("\n")) {
                if (line.isBlank() || line.strip().startsWith("--")) {
                    continue;
                }
                sql.append(line).append('\n');
                if (line.strip().endsWith(";")) {
                    String stmt = sql.toString().strip();
                    s.execute(stmt.substring(0, stmt.length() - 1));
                    sql.setLength(0);
                }
            }
        }
    }
}
