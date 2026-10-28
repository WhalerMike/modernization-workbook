package gov.example.modernization.ai;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * One entry in the agent's conversation. {@code data} carries structured content (the user's
 * request parameters, a tool call's arguments or a tool's result); a provider adapter would
 * serialize it to JSON for the provider.
 */
public record Message(Role role, String text, String toolName, Map<String, Object> data) {

    public enum Role { USER, ASSISTANT, TOOL }

    public Message {
        data = data == null ? Map.of() : Collections.unmodifiableMap(new LinkedHashMap<>(data));
    }

    public static Message user(String text, Map<String, Object> data) {
        return new Message(Role.USER, text, null, data);
    }

    public static Message toolCall(ModelReply.ToolCall call) {
        return new Message(Role.ASSISTANT, "tool call", call.tool(), call.arguments());
    }

    public static Message toolResult(String tool, Map<String, Object> result) {
        return new Message(Role.TOOL, "tool result", tool, result);
    }

    public boolean isResultOf(String tool) {
        return role == Role.TOOL && tool.equals(toolName);
    }
}
