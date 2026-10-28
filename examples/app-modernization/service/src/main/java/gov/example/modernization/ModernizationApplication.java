package gov.example.modernization;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@ConfigurationPropertiesScan
public class ModernizationApplication {

    public static void main(String[] args) {
        SpringApplication.run(ModernizationApplication.class, args);
    }

    /**
     * The service's notion of "now". Injected everywhere so tests (and demos) can pin "today"
     * with {@code app.clock.fixed-date}; otherwise the system clock in UTC.
     */
    @Bean
    Clock clock(@Value("${app.clock.fixed-date:}") String fixedDate) {
        if (fixedDate == null || fixedDate.isBlank()) {
            return Clock.systemUTC();
        }
        return Clock.fixed(LocalDate.parse(fixedDate).atStartOfDay(ZoneOffset.UTC).toInstant(), ZoneOffset.UTC);
    }
}
