package gov.example.modernization.ai;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Clock;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpServletResponse;

import gov.example.modernization.PostgresTestBase;
import gov.example.modernization.cases.CaseRepository;
import gov.example.modernization.cases.ProposalRepository;

/**
 * The developer workbook's labs: the API's answers and the agent's audit rows, written to
 * target/lab/ so a reader can open them. Same engine, schema and fixture as the other tests.
 *
 * <pre>
 * ./mvnw -q -pl service test -Dtest=LabRecordsTest
 * </pre>
 */
class LabRecordsTest extends PostgresTestBase {

    static final Path LAB = Path.of("target", "lab");

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

    private void save(String name, MockHttpServletResponse r) throws Exception {
        Files.createDirectories(LAB);
        String body = "{\"httpStatus\":" + r.getStatus() + ",\"contentType\":\"" + r.getContentType()
                + "\",\"body\":" + (r.getContentAsString(StandardCharsets.UTF_8).isEmpty() ? "null" : r.getContentAsString(StandardCharsets.UTF_8)) + "}";
        Files.writeString(LAB.resolve(name), body, StandardCharsets.UTF_8);
    }

    private void auditCsv(String name) throws Exception {
        List<String> lines = new ArrayList<>();
        lines.add("agent_id,tool,case_number,allowed,detail");
        for (Map<String, Object> row : jdbc.sql("select agent_id, tool, case_number, allowed, detail from agent_audit order by id")
                .query().listOfRows()) {
            lines.add(String.join(",", str(row.get("agent_id")), str(row.get("tool")), str(row.get("case_number")),
                    str(row.get("allowed")), "\"" + str(row.get("detail")).replace("\"", "\"\"") + "\""));
        }
        Files.createDirectories(LAB);
        Files.write(LAB.resolve(name), lines, StandardCharsets.UTF_8);
    }

    private static String str(Object o) {
        return o == null ? "" : o.toString();
    }

    /** Chapter 01: what the contract promises, as the running code answers it. */
    @Test
    void contractAnswers() throws Exception {
        save("api-open-cases.json", mvc.perform(get("/api/cases").param("status", "OPEN")).andReturn().getResponse());
        save("api-not-found.json", mvc.perform(get("/api/cases/C-999999")).andReturn().getResponse());
        save("api-bad-number.json", mvc.perform(get("/api/cases/12345")).andReturn().getResponse());
        save("api-bad-status.json", mvc.perform(get("/api/cases").param("status", "LOST")).andReturn().getResponse());
    }

    /** Chapter 04: triage proposes, the audit records every call, and only a person's decision changes a case. */
    @Test
    void triageAndDecision() throws Exception {
        save("triage-C-000001.json", mvc.perform(post("/api/cases/C-000001/triage")).andReturn().getResponse());
        long id = jdbc.sql("select id from agent_proposal").query(Long.class).single();
        save("case-before-decision.json", mvc.perform(get("/api/cases/C-000001")).andReturn().getResponse());
        save("decision-by-agent.json", mvc.perform(post("/api/proposals/{id}/decision", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"decision\":\"APPROVED\",\"decidedBy\":\"agent-case-triage-01\"}")).andReturn().getResponse());
        mvc.perform(post("/api/proposals/{id}/decision", id).contentType(MediaType.APPLICATION_JSON)
                .content("{\"decision\":\"APPROVED\",\"decidedBy\":\"reviewer-01\"}"));
        save("case-after-decision.json", mvc.perform(get("/api/cases/C-000001")).andReturn().getResponse());
        save("decision-twice.json", mvc.perform(post("/api/proposals/{id}/decision", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"decision\":\"REJECTED\",\"decidedBy\":\"reviewer-02\"}")).andReturn().getResponse());
        auditCsv("audit-triage.csv");
    }

    /** Chapter 04: a model that misbehaves, and what the guards write down. */
    @Test
    void guardrails() throws Exception {
        new CaseTriageAgent(new StubModelClient(clock, StubModelClient.Mode.REQUEST_DISALLOWED_TOOL), identity,
                cases, proposals, audit, clock, 5).triage("C-000004");
        new CaseTriageAgent(new StubModelClient(clock, StubModelClient.Mode.LOOP), identity,
                cases, proposals, audit, clock, 5).triage("C-000004");
        List<ModelReply> script = new ArrayList<>(List.of(
                new ModelReply.ToolCall("get_case", Map.of("case_number", "C-000004'; drop table applicant; --")),
                new ModelReply.ToolCall("propose_action", Map.of(
                        "case_number", "C-000002", "action", "FLAG_FOR_REVIEW", "rationale", "Another case."))));
        new CaseTriageAgent(request -> script.isEmpty() ? new ModelReply.FinalAnswer("done") : script.remove(0),
                identity, cases, proposals, audit, clock, 5).triage("C-000004");
        auditCsv("audit-guardrails.csv");
    }
}
