package gov.example.modernization;

import java.io.IOException;
import java.io.UncheckedIOException;

import io.zonky.test.db.postgres.embedded.EmbeddedPostgres;

/** One real PostgreSQL server per test JVM (Zonky embedded binaries), shared by every test class. */
public final class EmbeddedPg {

    private static EmbeddedPostgres instance;

    private EmbeddedPg() {
    }

    public static synchronized EmbeddedPostgres get() {
        if (instance == null) {
            try {
                instance = EmbeddedPostgres.builder().start();
            } catch (IOException e) {
                throw new UncheckedIOException("Could not start embedded PostgreSQL", e);
            }
            Runtime.getRuntime().addShutdownHook(new Thread(() -> {
                try {
                    instance.close();
                } catch (IOException ignored) {
                    // best effort on JVM exit
                }
            }));
        }
        return instance;
    }

    public static String jdbcUrl() {
        return get().getJdbcUrl("postgres", "postgres");
    }
}
