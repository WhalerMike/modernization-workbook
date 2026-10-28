package gov.example.modernization.migration;

import java.util.List;
import java.util.Map;

/** Per-table validation results. Holds keys and digests only, never row contents. */
public record ValidationReport(List<TableResult> tables) {

    public record TableResult(String table, String sourceTable, List<Check> checks) {
        public boolean passed() {
            return checks.stream().allMatch(Check::passed);
        }
    }

    /**
     * One check on one table.
     *
     * @param check  row_count, checksum_sha256 or aggregate
     * @param detail for a failed checksum, which primary keys differ, are missing or are extra (keys only)
     */
    public record Check(String check, boolean passed, Map<String, String> source, Map<String, String> target,
            String detail) {
    }

    public boolean passed() {
        return tables.stream().allMatch(TableResult::passed);
    }

    /** "table/check" for every failed check, for example "case_record/aggregate". */
    public List<String> failures() {
        return tables.stream()
                .flatMap(t -> t.checks().stream().filter(c -> !c.passed()).map(c -> t.table() + "/" + c.check()))
                .toList();
    }
}
