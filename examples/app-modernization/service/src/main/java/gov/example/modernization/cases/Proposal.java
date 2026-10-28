package gov.example.modernization.cases;

import java.time.OffsetDateTime;

public record Proposal(
        long id,
        String caseNumber,
        String agentId,
        String sponsor,
        String action,
        String rationale,
        String status,
        OffsetDateTime createdAt,
        String decidedBy,
        OffsetDateTime decidedAt) {
}
