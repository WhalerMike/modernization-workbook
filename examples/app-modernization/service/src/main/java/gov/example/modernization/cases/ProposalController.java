package gov.example.modernization.cases;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/proposals")
public class ProposalController {

    private final ProposalRepository proposals;
    private final ProposalService service;

    public ProposalController(ProposalRepository proposals, ProposalService service) {
        this.proposals = proposals;
        this.service = service;
    }

    @GetMapping
    public List<Proposal> list(@RequestParam(required = false) ProposalStatus status) {
        return proposals.list(status == null ? null : status.name());
    }

    @PostMapping("/{id}/decision")
    public Proposal decide(@PathVariable long id, @Valid @RequestBody DecisionRequest request) {
        return service.decide(id, request);
    }
}
