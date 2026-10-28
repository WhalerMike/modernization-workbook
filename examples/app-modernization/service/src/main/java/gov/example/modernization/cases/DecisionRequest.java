package gov.example.modernization.cases;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DecisionRequest(
        @NotNull Decision decision,
        @NotBlank @Size(max = 64) String decidedBy) {

    public enum Decision { APPROVED, REJECTED }
}
