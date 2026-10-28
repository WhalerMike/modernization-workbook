package gov.example.modernization.ai;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * A tool the agent may be offered: its name, what it does and its parameters (name to description).
 * A provider adapter would turn this into the provider's tool or function schema.
 */
public record ToolSpec(String name, String description, Map<String, String> parameters) {

    public static final String GET_CASE = "get_case";
    public static final String LIST_RELATED_CASES = "list_related_cases";
    public static final String PROPOSE_ACTION = "propose_action";

    /** Every tool this service implements. The agent identity's allow-list chooses from these. */
    public static final List<ToolSpec> ALL = List.of(
            new ToolSpec(GET_CASE, "Read one case record (read-only).",
                    Map.of("case_number", "Case number, format C-NNNNNN")),
            new ToolSpec(LIST_RELATED_CASES, "List the other cases of the same applicant (read-only).",
                    Map.of("case_number", "Case number, format C-NNNNNN")),
            new ToolSpec(PROPOSE_ACTION,
                    "Record a proposed action for a person to approve or reject. Changes no case record.",
                    Map.of("case_number", "The case being triaged",
                            "action", "One of FLAG_FOR_REVIEW, CLOSE_CASE",
                            "rationale", "Why, in one or two sentences (at most 1000 characters)")));

    public static Optional<ToolSpec> byName(String name) {
        return ALL.stream().filter(t -> t.name().equals(name)).findFirst();
    }
}
