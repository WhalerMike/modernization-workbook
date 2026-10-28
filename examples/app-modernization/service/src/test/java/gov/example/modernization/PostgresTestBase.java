package gov.example.modernization;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Every service test runs against a real PostgreSQL engine with the service's own Flyway V1 applied
 * at startup. "Today" is pinned to 2026-10-01 so the stub model's 365-day rule is deterministic.
 */
@SpringBootTest(properties = "app.clock.fixed-date=2026-10-01")
@AutoConfigureMockMvc
public abstract class PostgresTestBase {

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", EmbeddedPg::jdbcUrl);
        registry.add("spring.datasource.username", () -> "postgres");
        registry.add("spring.datasource.password", () -> "");
    }

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected JdbcClient jdbc;

    /** Synthetic fixture: obviously fake applicants, generic case types. */
    @BeforeEach
    void seed() {
        jdbc.sql("truncate agent_audit, agent_proposal, case_record, applicant restart identity cascade").update();
        jdbc.sql("""
                insert into applicant (id, last_name, first_name, state_code) values
                  (1, 'Applicant-0001', 'Test', 'XA'),
                  (2, 'Applicant-0002', 'Test', 'XB'),
                  (3, 'Applicant-0003', 'Test', 'XC')
                """).update();
        jdbc.sql("""
                insert into case_record (case_number, applicant_id, case_type, status, opened_on, closed_on,
                                         amount_claimed, updated_at) values
                  ('C-000001', 1, 'ABC', 'OPEN',    date '2025-06-01', null,              100.00, timestamptz '2025-06-01 12:00:00+00'),
                  ('C-000002', 2, 'DEF', 'OPEN',    date '2026-08-01', null,              250.50, timestamptz '2026-08-01 12:00:00+00'),
                  ('C-000003', 2, 'DEF', 'OPEN',    date '2026-09-01', null,              250.50, timestamptz '2026-09-01 12:00:00+00'),
                  ('C-000004', 3, 'ABC', 'OPEN',    date '2026-07-01', null,               75.25, timestamptz '2026-07-01 12:00:00+00'),
                  ('C-000005', 1, 'GHI', 'CLOSED',  date '2025-01-02', date '2025-06-30',  10.00, timestamptz '2025-06-30 12:00:00+00'),
                  ('C-000006', 1, 'ABC', 'PENDING', date '2026-09-15', null,              999.99, timestamptz '2026-09-15 12:00:00+00')
                """).update();
    }

    protected long count(String sql) {
        return jdbc.sql(sql).query(Long.class).single();
    }
}
