package gov.example.modernization.migration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

/** Rows in the target shape. Source rows are turned into these by {@link Transform}; target rows are read as-is. */
public final class Rows {

    private Rows() {
    }

    public record Applicant(long id, String lastName, String firstName, String stateCode) {
    }

    public record CaseRecord(String caseNumber, long applicantId, String caseType, String status,
            LocalDate openedOn, LocalDate closedOn, BigDecimal amountClaimed, OffsetDateTime updatedAt) {
    }
}
