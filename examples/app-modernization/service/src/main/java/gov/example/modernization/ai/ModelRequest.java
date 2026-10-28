package gov.example.modernization.ai;

import java.util.List;

/**
 * One turn's input to the model.
 *
 * @param systemInstruction what the agent is for and what it must not do
 * @param conversation      the conversation so far, including every tool call and tool result
 * @param tools             the only tools the model may request this turn (already filtered by the allow-list)
 */
public record ModelRequest(String systemInstruction, List<Message> conversation, List<ToolSpec> tools) {

    public ModelRequest {
        conversation = List.copyOf(conversation);
        tools = List.copyOf(tools);
    }
}
