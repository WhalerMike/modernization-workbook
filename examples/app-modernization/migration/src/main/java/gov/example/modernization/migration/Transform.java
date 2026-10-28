package gov.example.modernization.migration;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.OffsetDateTime;
import java.util.Map;

/**
 * The documented legacy-to-target transform. Every rule lives here:
 * <ul>
 * <li>CHAR padding: trailing spaces are removed from every text column (leading spaces are data and kept).</li>
 * <li>Status codes: O, P, C become OPEN, PENDING, CLOSED; any other code fails the run.</li>
 * <li>The 0001-01-01 "no date" sentinel becomes NULL.</li>
 * <li>Legacy TIMESTAMP has no zone: it is read as wall-clock time in the stated source zone and stored as timestamptz.</li>
 * <li>Amounts keep scale 2 exactly; a value that would need rounding fails the run.</li>
 * </ul>
 */
public final class Transform {

    public static final LocalDate NO_DATE_SENTINEL = LocalDate.of(1, 1, 1);

    public static final Map<String, String> STATUS_CODES = Map.of("O", "OPEN", "P", "PENDING", "C", "CLOSED");

    private Transform() {
    }

    public static String text(String legacy) {
        return legacy == null ? null : legacy.stripTrailing();
    }

    public static String status(String code, String key) {
        String mapped = STATUS_CODES.get(text(code));
        if (mapped == null) {
            throw new IllegalArgumentException("Unknown status code '" + code + "' on " + key);
        }
        return mapped;
    }

    public static LocalDate date(LocalDate legacy) {
        return legacy == null || NO_DATE_SENTINEL.equals(legacy) ? null : legacy;
    }

    public static OffsetDateTime timestamp(LocalDateTime legacy, ZoneId sourceZone) {
        return legacy == null ? null : legacy.atZone(sourceZone).toOffsetDateTime().withOffsetSameInstant(ZoneOffset.UTC);
    }

    public static BigDecimal amount(BigDecimal legacy) {
        return legacy == null ? null : legacy.setScale(2, RoundingMode.UNNECESSARY);
    }
}
