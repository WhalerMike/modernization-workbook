package gov.example.modernization.ai;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.Name;

/**
 * Who the agent is, who answers for it, and the only tools it may use. Bound from
 * {@code app.agent.id}, {@code app.agent.sponsor} and {@code app.agent.allowed-tools}.
 * Every proposal and audit row carries the agent id; every proposal also carries the sponsor.
 */
@ConfigurationProperties("app.agent")
public record AgentIdentity(@Name("id") String agentId, String sponsor, List<String> allowedTools) {

    public AgentIdentity {
        if (agentId == null || agentId.isBlank() || sponsor == null || sponsor.isBlank()) {
            throw new IllegalArgumentException("app.agent.id and app.agent.sponsor are required: an agent needs an identity and an owner");
        }
        allowedTools = allowedTools == null ? List.of() : allowedTools.stream().map(String::trim).toList();
    }

    public boolean mayUse(String tool) {
        return tool != null && allowedTools.contains(tool);
    }
}
