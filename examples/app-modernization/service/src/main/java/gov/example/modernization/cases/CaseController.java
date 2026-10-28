package gov.example.modernization.cases;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import gov.example.modernization.ai.CaseTriageAgent;
import gov.example.modernization.ai.TriageResult;

@RestController
@RequestMapping("/api/cases")
public class CaseController {

    private final CaseRepository cases;
    private final CaseTriageAgent agent;

    public CaseController(CaseRepository cases, CaseTriageAgent agent) {
        this.cases = cases;
        this.agent = agent;
    }

    @GetMapping
    public List<CaseView> list(@RequestParam(required = false) CaseStatus status) {
        return cases.list(status);
    }

    @GetMapping("/{caseNumber}")
    public CaseView get(@PathVariable String caseNumber) {
        CaseNumbers.require(caseNumber);
        return cases.find(caseNumber).orElseThrow(() -> new NotFoundException("Case " + caseNumber + " not found"));
    }

    @PostMapping("/{caseNumber}/triage")
    public TriageResult triage(@PathVariable String caseNumber) {
        get(caseNumber);
        return agent.triage(caseNumber);
    }
}
