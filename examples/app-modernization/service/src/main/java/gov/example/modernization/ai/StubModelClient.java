package gov.example.modernization.ai;

import java.time.Clock;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * A deterministic, rule-based stand-in for a model. No API key, no network, same answer every time.
 * It behaves like a well-mannered model: it requests only tools it was offered, one call per turn.
 *
 * <p>Rules: read the case, then its related cases. Propose FLAG_FOR_REVIEW if the case is OPEN, has
 * no closing date and was opened more than 365 days before "today" (from the injected clock).
 * Propose FLAG_FOR_REVIEW as a possible duplicate if it is OPEN and the applicant has another OPEN
 * case of the same type. Otherwise answer "no action".
 *
 * <p>Two misbehaving modes exist so tests can prove the agent's guards: {@link Mode#REQUEST_DISALLOWED_TOOL}
 * first asks for a tool that was never offered, and {@link Mode#LOOP} never stops calling tools.
 */
public class StubModelClient implements ModelClient {

    public enum Mode { RULES, REQUEST_DISALLOWED_TOOL, LOOP }

    static final String DISALLOWED_TOOL = "update_case_status";

    private final Clock clock;
    private final Mode mode;

    public StubModelClient(Clock clock, Mode mode) {
        this.clock = clock;
        this.mode = mode;
    }

    @Override
    public ModelReply next(ModelRequest request) {
        List<Message> conversation = request.conversation();
        String caseNumber = String.valueOf(conversation.get(0).data().get("case_number"));

        if (mode == Mode.LOOP) {
            return new ModelReply.ToolCall(ToolSpec.GET_CASE, Map.of("case_number", caseNumber));
        }
        if (mode == Mode.REQUEST_DISALLOWED_TOOL && last(conversation, DISALLOWED_TOOL) == null) {
            return new ModelReply.ToolCall(DISALLOWED_TOOL, Map.of("case_number", caseNumber, "status", "CLOSED"));
        }

        Map<String, Object> theCase = last(conversation, ToolSpec.GET_CASE);
        if (theCase == null) {
            return offered(request, ToolSpec.GET_CASE)
                    ? new ModelReply.ToolCall(ToolSpec.GET_CASE, Map.of("case_number", caseNumber))
                    : new ModelReply.FinalAnswer("Cannot triage: no read tool is available.");
        }
        if (theCase.containsKey("error")) {
            return new ModelReply.FinalAnswer("Cannot triage " + caseNumber + ": " + theCase.get("error") + ".");
        }
        Map<String, Object> related = last(conversation, ToolSpec.LIST_RELATED_CASES);
        if (related == null && offered(request, ToolSpec.LIST_RELATED_CASES)) {
            return new ModelReply.ToolCall(ToolSpec.LIST_RELATED_CASES, Map.of("case_number", caseNumber));
        }

        List<String> reasons = reasons(theCase, related);
        long alreadyProposed = conversation.stream().filter(m -> m.isResultOf(ToolSpec.PROPOSE_ACTION)).count();
        if (alreadyProposed < reasons.size() && offered(request, ToolSpec.PROPOSE_ACTION)) {
            return new ModelReply.ToolCall(ToolSpec.PROPOSE_ACTION, Map.of(
                    "case_number", caseNumber,
                    "action", ProposedAction.FLAG_FOR_REVIEW.name(),
                    "rationale", reasons.get((int) alreadyProposed)));
        }
        if (reasons.isEmpty()) {
            return new ModelReply.FinalAnswer("No action: case " + caseNumber + " needs no review.");
        }
        return new ModelReply.FinalAnswer("Proposed " + reasons.size() + " action(s) on case " + caseNumber
                + " for a person to approve or reject.");
    }

    private List<String> reasons(Map<String, Object> theCase, Map<String, Object> related) {
        List<String> reasons = new ArrayList<>();
        if (!"OPEN".equals(theCase.get("status"))) {
            return reasons;
        }
        LocalDate today = LocalDate.now(clock);
        LocalDate openedOn = LocalDate.parse((String) theCase.get("opened_on"));
        if (theCase.get("closed_on") == null && openedOn.isBefore(today.minusDays(365))) {
            reasons.add("Open more than 365 days (opened " + openedOn + ") with no closing date.");
        }
        if (related != null && related.get("cases") instanceof List<?> others) {
            for (Object o : others) {
                if (o instanceof Map<?, ?> other && "OPEN".equals(other.get("status"))
                        && theCase.get("case_type").equals(other.get("case_type"))) {
                    reasons.add("Possible duplicate: the applicant has another OPEN " + theCase.get("case_type")
                            + " case, " + other.get("case_number") + ".");
                    break;
                }
            }
        }
        return reasons;
    }

    private static Map<String, Object> last(List<Message> conversation, String tool) {
        for (int i = conversation.size() - 1; i >= 0; i--) {
            if (conversation.get(i).isResultOf(tool)) {
                return conversation.get(i).data();
            }
        }
        return null;
    }

    private static boolean offered(ModelRequest request, String tool) {
        return request.tools().stream().anyMatch(t -> t.name().equals(tool));
    }
}
