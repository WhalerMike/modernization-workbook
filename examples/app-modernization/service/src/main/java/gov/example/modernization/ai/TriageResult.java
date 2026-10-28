package gov.example.modernization.ai;

import java.util.List;

import gov.example.modernization.cases.Proposal;

/**
 * What one triage run produced: the model's final answer, how many model turns it used,
 * whether the step limit stopped it, and the PENDING proposals it recorded for human review.
 */
public record TriageResult(String caseNumber, String answer, int steps, boolean stoppedByStepLimit,
        List<Proposal> proposals) {
}
