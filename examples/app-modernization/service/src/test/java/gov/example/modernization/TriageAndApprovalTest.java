package gov.example.modernization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import gov.example.modernization.cases.ProposalRepository;

/** The agent proposes; only a person's decision changes a case. */
class TriageAndApprovalTest extends PostgresTestBase {

    @Autowired
    ProposalRepository proposals;

    private Map<String, Object> caseRow(String caseNumber) {
        return jdbc.sql("select status, closed_on, updated_at from case_record where case_number = :cn")
                .param("cn", caseNumber).query().singleRow();
    }

    @Test
    void triageOfAStaleCaseCreatesAPendingProposalAndLeavesTheCaseAlone() throws Exception {
        Map<String, Object> before = caseRow("C-000001");

        mvc.perform(post("/api/cases/C-000001/triage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.stoppedByStepLimit").value(false))
                .andExpect(jsonPath("$.proposals", hasSize(1)))
                .andExpect(jsonPath("$.proposals[0].action").value("FLAG_FOR_REVIEW"))
                .andExpect(jsonPath("$.proposals[0].status").value("PENDING"))
                .andExpect(jsonPath("$.proposals[0].agentId").value("agent-case-triage-01"))
                .andExpect(jsonPath("$.proposals[0].sponsor").value("case-operations-owner"))
                .andExpect(jsonPath("$.proposals[0].rationale", startsWith("Open more than 365 days")));

        assertThat(caseRow("C-000001")).isEqualTo(before);
        assertThat(count("select count(*) from agent_proposal where status = 'PENDING'")).isEqualTo(1);
        // get_case, list_related_cases, propose_action: every call audited, all allowed.
        assertThat(count("select count(*) from agent_audit where allowed")).isEqualTo(3);
        assertThat(count("select count(*) from agent_audit where not allowed")).isZero();
    }

    @Test
    void triageFlagsAPossibleDuplicate() throws Exception {
        mvc.perform(post("/api/cases/C-000002/triage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proposals", hasSize(1)))
                .andExpect(jsonPath("$.proposals[0].rationale", startsWith("Possible duplicate")));
    }

    @Test
    void triageWithNothingToDoAnswersNoAction() throws Exception {
        mvc.perform(post("/api/cases/C-000004/triage"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.proposals", hasSize(0)))
                .andExpect(jsonPath("$.answer", startsWith("No action")));
        assertThat(count("select count(*) from agent_proposal")).isZero();
    }

    @Test
    void rerunningTriageDoesNotDuplicateTheProposal() throws Exception {
        mvc.perform(post("/api/cases/C-000001/triage")).andExpect(status().isOk());
        mvc.perform(post("/api/cases/C-000001/triage")).andExpect(status().isOk());
        assertThat(count("select count(*) from agent_proposal")).isEqualTo(1);
    }

    @Test
    void triageOfAMissingCaseIs404() throws Exception {
        mvc.perform(post("/api/cases/C-999999/triage"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void approvingAFlagAppliesIt() throws Exception {
        mvc.perform(post("/api/cases/C-000001/triage")).andExpect(status().isOk());
        long id = jdbc.sql("select id from agent_proposal").query(Long.class).single();

        mvc.perform(get("/api/proposals").param("status", "PENDING"))
                .andExpect(jsonPath("$", hasSize(1)));

        mvc.perform(post("/api/proposals/{id}/decision", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROVED\",\"decidedBy\":\"reviewer-01\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"))
                .andExpect(jsonPath("$.decidedBy").value("reviewer-01"))
                .andExpect(jsonPath("$.decidedAt").isNotEmpty());

        assertThat(caseRow("C-000001").get("status")).isEqualTo("PENDING");
        mvc.perform(get("/api/proposals").param("status", "PENDING")).andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void approvingACloseClosesTheCaseWithTodaysDate() throws Exception {
        long id = proposals.createPending("C-000004", "agent-case-triage-01", "case-operations-owner",
                "CLOSE_CASE", "Synthetic test proposal.", OffsetDateTime.now()).id();

        mvc.perform(post("/api/proposals/{id}/decision", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROVED\",\"decidedBy\":\"reviewer-01\"}"))
                .andExpect(status().isOk());

        Map<String, Object> row = caseRow("C-000004");
        assertThat(row.get("status")).isEqualTo("CLOSED");
        assertThat(row.get("closed_on")).hasToString("2026-10-01");
    }

    @Test
    void rejectingChangesNoCase() throws Exception {
        mvc.perform(post("/api/cases/C-000001/triage")).andExpect(status().isOk());
        long id = jdbc.sql("select id from agent_proposal").query(Long.class).single();
        Map<String, Object> before = caseRow("C-000001");

        mvc.perform(post("/api/proposals/{id}/decision", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"REJECTED\",\"decidedBy\":\"reviewer-01\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));

        assertThat(caseRow("C-000001")).isEqualTo(before);
    }

    @Test
    void aProposalCanBeDecidedOnlyOnce() throws Exception {
        mvc.perform(post("/api/cases/C-000001/triage")).andExpect(status().isOk());
        long id = jdbc.sql("select id from agent_proposal").query(Long.class).single();
        String body = "{\"decision\":\"REJECTED\",\"decidedBy\":\"reviewer-01\"}";
        mvc.perform(post("/api/proposals/{id}/decision", id).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk());
        mvc.perform(post("/api/proposals/{id}/decision", id).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void theAgentCannotApproveItsOwnProposal() throws Exception {
        mvc.perform(post("/api/cases/C-000001/triage")).andExpect(status().isOk());
        long id = jdbc.sql("select id from agent_proposal").query(Long.class).single();
        mvc.perform(post("/api/proposals/{id}/decision", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROVED\",\"decidedBy\":\"agent-case-triage-01\"}"))
                .andExpect(status().isBadRequest());
        assertThat(caseRow("C-000001").get("status")).isEqualTo("OPEN");
    }

    @Test
    void invalidDecisionBodiesAreProblemDetails() throws Exception {
        mvc.perform(post("/api/proposals/1/decision").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROVED\",\"decidedBy\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
        mvc.perform(post("/api/proposals/1/decision").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"MAYBE\",\"decidedBy\":\"reviewer-01\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
        mvc.perform(post("/api/proposals/999/decision").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"decision\":\"APPROVED\",\"decidedBy\":\"reviewer-01\"}"))
                .andExpect(status().isNotFound());
    }
}
