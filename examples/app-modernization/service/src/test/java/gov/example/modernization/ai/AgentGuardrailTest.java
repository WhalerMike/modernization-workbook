package gov.example.modernization.ai;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import gov.example.modernization.PostgresTestBase;
import gov.example.modernization.cases.CaseRepository;
import gov.example.modernization.cases.ProposalRepository;

/** The guards around the model: allow-list, argument validation, step limit, audit. */
class AgentGuardrailTest extends PostgresTestBase {

    @Autowired
    CaseRepository cases;
    @Autowired
    ProposalRepository proposals;
    @Autowired
    AgentAuditLog audit;
    @Autowired
    AgentIdentity identity;
    @Autowired
    Clock clock;

    private CaseTriageAgent agent(ModelClient model, AgentIdentity id, int maxSteps) {
        return new CaseTriageAgent(model, id, cases, proposals, audit, clock, maxSteps);
    }

    /** A model that plays back a fixed script of replies, then gives a final answer. */
    private static ModelClient scripted(List<ModelReply> script, List<ModelRequest> seen) {
        List<ModelReply> remaining = new ArrayList<>(script);
        return request -> {
            seen.add(request);
            return remaining.isEmpty() ? new ModelReply.FinalAnswer("done") : remaining.remove(0);
        };
    }

    private Map<String, Object> caseRow(String caseNumber) {
        return jdbc.sql("select status, closed_on, updated_at from case_record where case_number = :cn")
                .param("cn", caseNumber).query().singleRow();
    }

    @Test
    void aToolThatIsNotOnTheAllowListIsDeniedAndAudited() {
        Map<String, Object> before = caseRow("C-000001");
        TriageResult result = agent(new StubModelClient(clock, StubModelClient.Mode.REQUEST_DISALLOWED_TOOL),
                identity, 5).triage("C-000001");

        assertThat(caseRow("C-000001")).isEqualTo(before);
        Map<String, Object> denied = jdbc.sql("select tool, allowed, detail from agent_audit order by id limit 1")
                .query().singleRow();
        assertThat(denied.get("tool")).isEqualTo(StubModelClient.DISALLOWED_TOOL);
        assertThat(denied.get("allowed")).isEqualTo(false);
        assertThat((String) denied.get("detail")).startsWith("denied");
        // After the denial the stub carries on with its normal, allowed work.
        assertThat(result.proposals()).hasSize(1);
    }

    @Test
    void aKnownToolLeftOffTheAllowListIsNeitherOfferedNorRun() {
        AgentIdentity readOnly = new AgentIdentity("agent-read-only", "case-operations-owner", List.of("get_case"));
        List<ModelRequest> seen = new ArrayList<>();
        ModelClient model = scripted(List.of(new ModelReply.ToolCall("propose_action", Map.of(
                "case_number", "C-000001", "action", "CLOSE_CASE", "rationale", "Untrusted request."))), seen);

        agent(model, readOnly, 5).triage("C-000001");

        assertThat(seen.get(0).tools()).extracting(ToolSpec::name).containsExactly("get_case");
        assertThat(count("select count(*) from agent_proposal")).isZero();
        assertThat(count("select count(*) from agent_audit where tool = 'propose_action' and not allowed"))
                .isEqualTo(1);
    }

    @Test
    void theStepLimitStopsALoopingModel() {
        TriageResult result = agent(new StubModelClient(clock, StubModelClient.Mode.LOOP), identity, 5)
                .triage("C-000001");

        assertThat(result.stoppedByStepLimit()).isTrue();
        assertThat(result.steps()).isEqualTo(5);
        assertThat(count("select count(*) from agent_audit where tool = 'get_case'")).isEqualTo(5);
        assertThat(count("select count(*) from agent_audit where tool = 'step_limit' and not allowed"))
                .isEqualTo(1);
    }

    @Test
    void invalidArgumentsAreRejectedBeforeAnythingRuns() {
        ModelClient model = scripted(List.of(
                new ModelReply.ToolCall("get_case", Map.of("case_number", "C-000001'; drop table applicant; --")),
                new ModelReply.ToolCall("get_case", Map.of("case_number", "C-000001", "sql", "select 1")),
                new ModelReply.ToolCall("propose_action", Map.of(
                        "case_number", "C-000002", "action", "FLAG_FOR_REVIEW", "rationale", "Other case.")),
                new ModelReply.ToolCall("propose_action", Map.of(
                        "case_number", "C-000001", "action", "DELETE_CASE", "rationale", "Unknown action.")),
                new ModelReply.ToolCall("propose_action", Map.of(
                        "case_number", "C-000001", "action", "CLOSE_CASE", "rationale", " "))),
                new ArrayList<>());

        TriageResult result = agent(model, identity, 10).triage("C-000001");

        assertThat(result.proposals()).isEmpty();
        assertThat(count("select count(*) from agent_proposal")).isZero();
        assertThat(count("select count(*) from agent_audit where not allowed and detail like 'rejected: invalid arguments%'"))
                .isEqualTo(5);
        assertThat(count("select count(*) from applicant")).isEqualTo(3);
    }
}
