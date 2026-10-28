package gov.example.modernization.ai;

/**
 * Provider-neutral model interface. The agent loop depends only on this; a provider adapter
 * (a hosted model API, a model served inside the boundary) implements it by translating
 * {@link ModelRequest} into the provider's request format and the provider's reply back into
 * a {@link ModelReply}. Nothing else in the service knows which provider is in use.
 */
@FunctionalInterface
public interface ModelClient {

    /** Given the instruction, the conversation so far and the offered tools, return the model's next move. */
    ModelReply next(ModelRequest request);
}
