package gov.example.modernization.migration;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.function.Function;

/**
 * Compares the whole source with the whole target, table by table, with three checks:
 * row counts, an order-independent SHA-256 checksum of canonical rows, and an aggregate
 * reconciliation computed in SQL on each side independently.
 */
public final class Validator {

    private Validator() {
    }

    public static ValidationReport validate(LegacySource source, TargetStore target) throws SQLException {
        List<ValidationReport.TableResult> tables = new ArrayList<>();
        tables.add(table("applicant", "APPLICANT",
                keyed(source.applicants(null), a -> Long.toString(a.id()), Canonical::applicant),
                keyed(target.applicants(), a -> Long.toString(a.id()), Canonical::applicant),
                source.applicantAggregate(), target.applicantAggregate()));
        tables.add(table("case_record", "CASE_MSTR",
                keyed(source.cases(null), Rows.CaseRecord::caseNumber, Canonical::caseRecord),
                keyed(target.cases(), Rows.CaseRecord::caseNumber, Canonical::caseRecord),
                source.caseAggregate(), target.caseAggregate()));
        return new ValidationReport(tables);
    }

    /**
     * Primary key to canonical row, sorted by key in Java (not by the database, whose collations differ).
     * Long keys are zero-padded so they sort numerically.
     */
    static <T> TreeMap<String, String> keyed(List<T> rows, Function<T, String> key, Function<T, String> canonical) {
        TreeMap<String, String> out = new TreeMap<>();
        for (T row : rows) {
            String k = key.apply(row);
            out.put(k.chars().allMatch(Character::isDigit) ? String.format("%020d", Long.parseLong(k)) : k,
                    canonical.apply(row));
        }
        return out;
    }

    private static ValidationReport.TableResult table(String table, String sourceTable,
            TreeMap<String, String> src, TreeMap<String, String> tgt,
            Map<String, String> srcAgg, Map<String, String> tgtAgg) {
        List<ValidationReport.Check> checks = new ArrayList<>();

        checks.add(new ValidationReport.Check("row_count", src.size() == tgt.size(),
                Map.of("rows", Integer.toString(src.size())), Map.of("rows", Integer.toString(tgt.size())), null));

        String srcSum = sha256(src);
        String tgtSum = sha256(tgt);
        checks.add(new ValidationReport.Check("checksum_sha256", srcSum.equals(tgtSum),
                Map.of("sha256", srcSum), Map.of("sha256", tgtSum),
                srcSum.equals(tgtSum) ? null : differences(src, tgt)));

        checks.add(new ValidationReport.Check("aggregate", srcAgg.equals(tgtAgg), srcAgg, tgtAgg, null));
        return new ValidationReport.TableResult(table, sourceTable, checks);
    }

    /** SHA-256 over "canonical row\n" for every row in primary-key order. */
    static String sha256(TreeMap<String, String> rows) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            for (String line : rows.values()) {
                md.update(line.getBytes(StandardCharsets.UTF_8));
                md.update((byte) '\n');
            }
            return HexFormat.of().formatHex(md.digest());
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }

    /** Keys only: which rows differ, are missing from the target, or are extra in it. */
    private static String differences(TreeMap<String, String> src, TreeMap<String, String> tgt) {
        List<String> differ = new ArrayList<>();
        List<String> missing = new ArrayList<>();
        List<String> extra = new ArrayList<>();
        src.forEach((k, v) -> {
            if (!tgt.containsKey(k)) {
                missing.add(display(k));
            } else if (!Objects.equals(v, tgt.get(k))) {
                differ.add(display(k));
            }
        });
        tgt.keySet().stream().filter(k -> !src.containsKey(k)).map(Validator::display).forEach(extra::add);
        return "differ " + sample(differ) + "; missing from target " + sample(missing) + "; extra in target "
                + sample(extra);
    }

    private static String display(String key) {
        return key.chars().allMatch(Character::isDigit) ? Long.toString(Long.parseLong(key)) : key;
    }

    private static String sample(List<String> keys) {
        int shown = Math.min(keys.size(), 10);
        return keys.size() + (keys.isEmpty() ? "" : " " + keys.subList(0, shown) + (keys.size() > shown ? "..." : ""));
    }
}
