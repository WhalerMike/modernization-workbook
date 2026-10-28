package gov.example.modernization.cases;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

@Repository
public class ProposalRepository {

    private static final String SELECT = """
            select id, case_number, agent_id, sponsor, action, rationale, status, created_at, decided_by, decided_at
              from agent_proposal
            """;

    private final JdbcClient jdbc;

    public ProposalRepository(JdbcClient jdbc) {
        this.jdbc = jdbc;
    }

    /** Inserts a PENDING proposal, or returns the identical PENDING one if it already exists. */
    public Proposal createPending(String caseNumber, String agentId, String sponsor, String action, String rationale,
            OffsetDateTime now) {
        Optional<Proposal> existing = jdbc.sql(SELECT
                        + " where case_number = :cn and action = :a and rationale = :r and status = 'PENDING'")
                .param("cn", caseNumber).param("a", action).param("r", rationale)
                .query(ProposalRepository::map).optional();
        if (existing.isPresent()) {
            return existing.get();
        }
        long id = jdbc.sql("insert into agent_proposal"
                        + " (case_number, agent_id, sponsor, action, rationale, status, created_at)"
                        + " values (:cn, :agent, :sponsor, :a, :r, 'PENDING', :now) returning id")
                .param("cn", caseNumber).param("agent", agentId).param("sponsor", sponsor)
                .param("a", action).param("r", rationale).param("now", now)
                .query(Long.class).single();
        return find(id).orElseThrow();
    }

    public Optional<Proposal> find(long id) {
        return jdbc.sql(SELECT + " where id = :id").param("id", id).query(ProposalRepository::map).optional();
    }

    public List<Proposal> list(String status) {
        if (status == null) {
            return jdbc.sql(SELECT + " order by id").query(ProposalRepository::map).list();
        }
        return jdbc.sql(SELECT + " where status = :s order by id").param("s", status)
                .query(ProposalRepository::map).list();
    }

    /** Moves a PENDING proposal to a decision. Returns false if it was no longer PENDING. */
    public boolean decide(long id, String status, String decidedBy, OffsetDateTime now) {
        return jdbc.sql("update agent_proposal set status = :s, decided_by = :by, decided_at = :now"
                        + " where id = :id and status = 'PENDING'")
                .param("s", status).param("by", decidedBy).param("now", now).param("id", id)
                .update() == 1;
    }

    private static Proposal map(ResultSet rs, int row) throws SQLException {
        return new Proposal(
                rs.getLong("id"),
                rs.getString("case_number"),
                rs.getString("agent_id"),
                rs.getString("sponsor"),
                rs.getString("action"),
                rs.getString("rationale"),
                rs.getString("status"),
                rs.getObject("created_at", OffsetDateTime.class),
                rs.getString("decided_by"),
                rs.getObject("decided_at", OffsetDateTime.class));
    }
}
