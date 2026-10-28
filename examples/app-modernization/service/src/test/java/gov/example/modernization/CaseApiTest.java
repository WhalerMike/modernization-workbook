package gov.example.modernization;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class CaseApiTest extends PostgresTestBase {

    @Test
    void listsAllCasesNewestFirst() throws Exception {
        mvc.perform(get("/api/cases"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].caseNumber",
                        contains("C-000006", "C-000003", "C-000002", "C-000004", "C-000001", "C-000005")));
    }

    @Test
    void filtersByStatus() throws Exception {
        mvc.perform(get("/api/cases").param("status", "CLOSED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].caseNumber").value("C-000005"))
                .andExpect(jsonPath("$[0].closedOn").value("2025-06-30"));
    }

    @Test
    void unknownStatusIsAProblem() throws Exception {
        mvc.perform(get("/api/cases").param("status", "LOST"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void getsOneCase() throws Exception {
        mvc.perform(get("/api/cases/C-000002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.applicantName").value("Applicant-0002, Test"))
                .andExpect(jsonPath("$.caseType").value("DEF"))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.openedOn").value("2026-08-01"))
                .andExpect(jsonPath("$.amountClaimed").value(250.50));
    }

    @Test
    void missingCaseIs404ProblemDetails() throws Exception {
        mvc.perform(get("/api/cases/C-999999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.title").value("Not found"))
                .andExpect(jsonPath("$.detail").value("Case C-999999 not found"));
    }

    @Test
    void malformedCaseNumberIs400() throws Exception {
        mvc.perform(get("/api/cases/not-a-case"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void runsAgainstRealPostgresql() {
        org.assertj.core.api.Assertions.assertThat(jdbc.sql("select version()").query(String.class).single())
                .startsWith("PostgreSQL 18");
    }

    @Test
    void healthIsUp() throws Exception {
        mvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }
}
