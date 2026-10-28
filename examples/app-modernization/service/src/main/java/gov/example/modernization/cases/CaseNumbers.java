package gov.example.modernization.cases;

import java.util.regex.Pattern;

/** The one definition of a well-formed case number, used by the API and by the agent's argument checks. */
public final class CaseNumbers {

    /** "C-" followed by six digits, for example C-000123. */
    public static final Pattern FORMAT = Pattern.compile("^C-[0-9]{6}$");

    private CaseNumbers() {
    }

    public static boolean isValid(Object value) {
        return value instanceof String s && FORMAT.matcher(s).matches();
    }

    public static String require(String value) {
        if (!isValid(value)) {
            throw new IllegalArgumentException("Case number must match " + FORMAT.pattern());
        }
        return value;
    }
}
