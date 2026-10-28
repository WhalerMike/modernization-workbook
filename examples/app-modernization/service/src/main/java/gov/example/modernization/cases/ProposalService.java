package gov.example.modernization.cases;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import gov.example.modernization.ai.AgentIdentity;
import gov.example.modernization.ai.ProposedAction;

/**
 * The human approval step. This is the only code path that changes a case record because of an
 * agent's proposal, and it runs only when a person records a decision.
 */
@Service
public class ProposalService {

    private final ProposalRepository proposals;
    private final CaseRepository cases;
    private final AgentIdentity agent;
    private final Clock clock;

    public ProposalService(ProposalRepository proposals, CaseRepository cases, AgentIdentity agent, Clock clock) {
        this.proposals = proposals;
        this.cases = cases;
        this.agent = agent;
        this.clock = clock;
    }

    @Transactional
    public Proposal decide(long id, DecisionRequest request) {
        Proposal proposal = proposals.find(id)
                .orElseThrow(() -> new NotFoundException("Proposal " + id + " not found"));
        String by = request.decidedBy().trim();
        if (by.equalsIgnoreCase(proposal.agentId()) || by.equalsIgnoreCase(agent.agentId())) {
            throw new IllegalArgumentException("An agent cannot decide on a proposal; a person must");
        }
        OffsetDateTime now = OffsetDateTime.now(clock);
        if (!proposals.decide(id, request.decision().name(), by, now)) {
            throw new IllegalStateException("Proposal " + id + " is already " + proposal.status());
        }
        if (request.decision() == DecisionRequest.Decision.APPROVED) {
            apply(proposal, now);
        }
        return proposals.find(id).orElseThrow();
    }

    private void apply(Proposal proposal, OffsetDateTime now) {
        CaseView c = cases.find(proposal.caseNumber())
                .orElseThrow(() -> new NotFoundException("Case " + proposal.caseNumber() + " not found"));
        switch (ProposedAction.valueOf(proposal.action())) {
            case CLOSE_CASE -> cases.updateStatus(c.caseNumber(), CaseStatus.CLOSED, LocalDate.now(clock), now);
            case FLAG_FOR_REVIEW -> {
                // Flagging moves an OPEN case to PENDING (awaiting review); other statuses are left alone.
                if (c.status() == CaseStatus.OPEN) {
                    cases.updateStatus(c.caseNumber(), CaseStatus.PENDING, c.closedOn(), now);
                }
            }
        }
    }
}
