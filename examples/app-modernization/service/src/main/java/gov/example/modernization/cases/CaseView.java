package gov.example.modernization.cases;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public record CaseView(
        String caseNumber,
        long applicantId,
        String applicantName,
        String stateCode,
        String caseType,
        CaseStatus status,
        LocalDate openedOn,
        LocalDate closedOn,
        BigDecimal amountClaimed,
        OffsetDateTime updatedAt) {
}
