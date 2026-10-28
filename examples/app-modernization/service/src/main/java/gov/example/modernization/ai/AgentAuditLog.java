package gov.example.modernization.ai;

import java.time.Clock;
import java.time.OffsetDateTime;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Writes one agent_audit row per tool call, allowed or not. */
@Repository
public class AgentAuditLog {

    private final JdbcClient jdbc;
    private final Clock clock;

    public AgentAuditLog(JdbcClient jdbc, Clock clock) {
        this.jdbc = jdbc;
        this.clock = clock;
    }

    public void record(String agentId, String tool, String caseNumber, boolean allowed, String detail) {
        jdbc.sql("insert into agent_audit (agent_id, tool, case_number, allowed, detail, at)"
                        + " values (:agent, :tool, :cn, :allowed, :detail, :at)")
                .param("agent", agentId)
                .param("tool", truncate(tool == null ? "(none)" : tool, 64))
                .param("cn", caseNumber)
                .param("allowed", allowed)
                .param("detail", truncate(detail, 1000))
                .param("at", OffsetDateTime.now(clock))
                .update();
    }

    private static String truncate(String s, int max) {
        return s == null || s.length() <= max ? s : s.substring(0, max);
    }
}
