package gov.example.modernization.ai;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import gov.example.modernization.cases.CaseNumbers;
import gov.example.modernization.cases.CaseRepository;
import gov.example.modernization.cases.CaseView;
import gov.example.modernization.cases.Proposal;
import gov.example.modernization.cases.ProposalRepository;

/**
 * The agent loop. It offers the model only the tools on the agent identity's allow-list, treats
 * every reply as untrusted (tool name and arguments are checked before anything runs), audits every
 * tool call whether it ran or not, and stops after a hard step limit. Its only write is a PENDING
 * agent_proposal row: it never changes a case record. A person does that, through ProposalService.
 */
@Component
public class CaseTriageAgent {

    static final String SYSTEM_INSTRUCTION = """
            You triage one case. Read it with get_case and list_related_cases. If it needs a person's \
            attention, call propose_action once per reason. You cannot change case records; a person \
            approves or rejects each proposal. When you are done, answer in one sentence.""";

    private static final int MAX_RATIONALE = 1000;

    private final ModelClient model;
    private final AgentIdentity identity;
    private final CaseRepository cases;
    private final ProposalRepository proposals;
    private final AgentAuditLog audit;
    private final Clock clock;
    private final int maxSteps;

    public CaseTriageAgent(ModelClient model, AgentIdentity identity, CaseRepository cases,
            ProposalRepository proposals, AgentAuditLog audit, Clock clock,
            @Value("${app.agent.max-steps:5}") int maxSteps) {
        if (maxSteps < 1) {
            throw new IllegalArgumentException("app.agent.max-steps must be at least 1");
        }
        this.model = model;
        this.identity = identity;
        this.cases = cases;
        this.proposals = proposals;
        this.audit = audit;
        this.clock = clock;
        this.maxSteps = maxSteps;
    }

    public TriageResult triage(String caseNumber) {
        CaseNumbers.require(caseNumber);
        List<ToolSpec> offered = ToolSpec.ALL.stream().filter(t -> identity.mayUse(t.name())).toList();
        List<Message> conversation = new ArrayList<>();
        conversation.add(Message.user("Triage case " + caseNumber, Map.of("case_number", caseNumber)));
        List<Proposal> made = new ArrayList<>();

        for (int step = 1; step <= maxSteps; step++) {
            ModelReply reply = model.next(new ModelRequest(SYSTEM_INSTRUCTION, conversation, offered));
            if (reply instanceof ModelReply.FinalAnswer answer) {
                return new TriageResult(caseNumber, answer.text(), step, false, List.copyOf(made));
            }
            if (!(reply instanceof ModelReply.ToolCall call)) {
                audit.record(identity.agentId(), "(none)", caseNumber, false, "rejected: empty model reply");
                return new TriageResult(caseNumber, "Stopped: the model returned no usable reply", step, false,
                        List.copyOf(made));
            }
            conversation.add(Message.toolCall(call));
            conversation.add(Message.toolResult(String.valueOf(call.tool()), execute(call, caseNumber, made)));
        }
        audit.record(identity.agentId(), "step_limit", caseNumber, false,
                "stopped after " + maxSteps + " steps without a final answer");
        return new TriageResult(caseNumber, "Stopped: step limit of " + maxSteps + " reached", maxSteps, true,
                List.copyOf(made));
    }

    private Map<String, Object> execute(ModelReply.ToolCall call, String triagedCase, List<Proposal> made) {
        String tool = call.tool();
        String agentId = identity.agentId();
        if (!identity.mayUse(tool) || ToolSpec.byName(tool).isEmpty()) {
            audit.record(agentId, tool, triagedCase, false, "denied: tool is not on the agent's allow-list");
            return error("tool not permitted");
        }
        Optional<String> invalid = validate(tool, call.arguments(), triagedCase);
        if (invalid.isPresent()) {
            audit.record(agentId, tool, triagedCase, false, "rejected: invalid arguments: " + invalid.get());
            return error("invalid arguments: " + invalid.get());
        }
        String caseNumber = (String) call.arguments().get("case_number");
        Map<String, Object> result = switch (tool) {
            case ToolSpec.GET_CASE -> cases.find(caseNumber).map(CaseTriageAgent::toData)
                    .orElseGet(() -> error("case not found"));
            case ToolSpec.LIST_RELATED_CASES -> Map.of("cases",
                    cases.relatedTo(caseNumber).stream().map(CaseTriageAgent::toData).toList());
            case ToolSpec.PROPOSE_ACTION -> {
                Proposal p = proposals.createPending(caseNumber, agentId, identity.sponsor(),
                        (String) call.arguments().get("action"), ((String) call.arguments().get("rationale")).trim(),
                        OffsetDateTime.now(clock));
                made.add(p);
                yield Map.of("proposal_id", p.id(), "status", p.status());
            }
            default -> throw new IllegalStateException("unreachable: " + tool);
        };
        audit.record(agentId, tool, caseNumber, true, result.containsKey("error") ? "ran: " + result.get("error") : "ran");
        return result;
    }

    /** Model output is untrusted: check every argument before it reaches a query. */
    static Optional<String> validate(String tool, Map<String, Object> args, String triagedCase) {
        Set<String> expected = ToolSpec.byName(tool).orElseThrow().parameters().keySet();
        for (String key : args.keySet()) {
            if (!expected.contains(key)) {
                return Optional.of("unexpected argument '" + truncate(key) + "'");
            }
        }
        if (!CaseNumbers.isValid(args.get("case_number"))) {
            return Optional.of("case_number must match " + CaseNumbers.FORMAT.pattern());
        }
        if (ToolSpec.PROPOSE_ACTION.equals(tool)) {
            if (!triagedCase.equals(args.get("case_number"))) {
                return Optional.of("may only propose actions for the case being triaged");
            }
            Object action = args.get("action");
            boolean known = action instanceof String s
                    && java.util.Arrays.stream(ProposedAction.values()).anyMatch(a -> a.name().equals(s));
            if (!known) {
                return Optional.of("action must be one of FLAG_FOR_REVIEW, CLOSE_CASE");
            }
            if (!(args.get("rationale") instanceof String r) || r.isBlank() || r.length() > MAX_RATIONALE) {
                return Optional.of("rationale must be 1 to " + MAX_RATIONALE + " characters");
            }
        }
        return Optional.empty();
    }

    private static Map<String, Object> toData(CaseView c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("case_number", c.caseNumber());
        m.put("applicant_id", c.applicantId());
        m.put("case_type", c.caseType());
        m.put("status", c.status().name());
        m.put("opened_on", c.openedOn().toString());
        m.put("closed_on", c.closedOn() == null ? null : c.closedOn().toString());
        m.put("amount_claimed", c.amountClaimed().toPlainString());
        return m;
    }

    private static Map<String, Object> error(String message) {
        return Map.of("error", message);
    }

    private static String truncate(String s) {
        return s.length() <= 32 ? s : s.substring(0, 32) + "...";
    }
}
