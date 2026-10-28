package gov.example.modernization.migration;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

/**
 * The one definition of a row's canonical string, used for the checksum on both sides.
 * <ul>
 * <li>Fields in table column order, separated by '|'. In text, '\' and '|' are escaped as "\\" and "\|".</li>
 * <li>NULL is the token {@code \N} (which escaped text can never produce).</li>
 * <li>Text exactly as given: the source side is already transformed (padding removed); the target side
 * is rendered as stored, so stray padding or truncation in the target is a difference.</li>
 * <li>Dates ISO 8601 (yyyy-MM-dd). Timestamps as UTC instants, ISO 8601, truncated to microseconds.</li>
 * <li>Amounts as plain decimals with scale 2 (1234.50, never 1.2345E3).</li>
 * </ul>
 */
public final class Canonical {

    public static final String NULL = "\\N";

    private Canonical() {
    }

    public static String applicant(Rows.Applicant a) {
        return join(Long.toString(a.id()), text(a.lastName()), text(a.firstName()), text(a.stateCode()));
    }

    public static String caseRecord(Rows.CaseRecord c) {
        return join(text(c.caseNumber()), Long.toString(c.applicantId()), text(c.caseType()), text(c.status()),
                date(c.openedOn()), date(c.closedOn()), amount(c.amountClaimed()), timestamp(c.updatedAt()));
    }

    static String text(String s) {
        return s == null ? NULL : s.replace("\\", "\\\\").replace("|", "\\|");
    }

    static String date(LocalDate d) {
        return d == null ? NULL : d.format(DateTimeFormatter.ISO_LOCAL_DATE);
    }

    static String amount(BigDecimal b) {
        return b == null ? NULL : b.setScale(2, RoundingMode.UNNECESSARY).toPlainString();
    }

    static String timestamp(OffsetDateTime t) {
        return t == null ? NULL : DateTimeFormatter.ISO_INSTANT.format(t.toInstant().truncatedTo(ChronoUnit.MICROS));
    }

    private static String join(String... fields) {
        return String.join("|", fields);
    }
}
