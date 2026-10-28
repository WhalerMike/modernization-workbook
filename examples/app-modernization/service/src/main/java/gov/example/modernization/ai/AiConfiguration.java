package gov.example.modernization.ai;

import java.time.Clock;
import java.util.Locale;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Chooses the model client. Only the stub ships here. A real provider adapter would be another
 * {@code @Bean} conditional on {@code app.ai.provider=<name>}, implementing {@link ModelClient}.
 */
@Configuration
public class AiConfiguration {

    @Bean
    @ConditionalOnProperty(name = "app.ai.provider", havingValue = "stub", matchIfMissing = true)
    ModelClient stubModelClient(Clock clock, @Value("${app.ai.stub.mode:rules}") String mode) {
        return new StubModelClient(clock,
                StubModelClient.Mode.valueOf(mode.trim().toUpperCase(Locale.ROOT).replace('-', '_')));
    }
}
