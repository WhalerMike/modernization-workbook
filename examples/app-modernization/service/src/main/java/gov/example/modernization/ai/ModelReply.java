package gov.example.modernization.ai;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/** The model's next move: either a final text answer or exactly one tool call. Both are untrusted. */
public sealed interface ModelReply {

    record FinalAnswer(String text) implements ModelReply {
    }

    /** A request to run one tool. The arguments are whatever the model produced and are validated before use. */
    record ToolCall(String tool, Map<String, Object> arguments) implements ModelReply {
        public ToolCall {
            arguments = arguments == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(arguments));
        }
    }
}
