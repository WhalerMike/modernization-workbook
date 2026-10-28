package gov.example.modernization;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.InputStream;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import org.yaml.snakeyaml.Yaml;

/**
 * API-first guard: the hand-written OpenAPI contract and the controllers must describe the same
 * set of operations under /api. A path in one and not the other fails the build.
 */
class OpenApiContractTest extends PostgresTestBase {

    private static final Set<String> HTTP_METHODS = Set.of("get", "put", "post", "delete", "patch", "head", "options");

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    RequestMappingHandlerMapping mappings;

    @Test
    void contractAndControllersDescribeTheSameOperations() throws Exception {
        Set<String> documented = documentedOperations();
        assertThat(documented).hasSize(5);
        assertThat(implementedOperations()).isEqualTo(documented);
    }

    @Test
    void contractIsServed() throws Exception {
        mvc.perform(get("/openapi.yaml")).andExpect(status().isOk());
    }

    @SuppressWarnings("unchecked")
    private static Set<String> documentedOperations() throws Exception {
        try (InputStream in = OpenApiContractTest.class.getResourceAsStream("/static/openapi.yaml")) {
            Map<String, Object> doc = new Yaml().load(in);
            Map<String, Map<String, Object>> paths = (Map<String, Map<String, Object>>) doc.get("paths");
            Set<String> ops = new TreeSet<>();
            paths.forEach((path, item) -> item.keySet().stream()
                    .filter(HTTP_METHODS::contains)
                    .forEach(method -> ops.add(method.toUpperCase() + " " + path)));
            return ops;
        }
    }

    private Set<String> implementedOperations() {
        Set<String> ops = new TreeSet<>();
        mappings.getHandlerMethods().keySet().forEach(info -> {
            if (info.getPathPatternsCondition() == null) {
                return;
            }
            for (String pattern : info.getPathPatternsCondition().getPatternValues()) {
                if (pattern.startsWith("/api/")) {
                    info.getMethodsCondition().getMethods().forEach(m -> ops.add(m.name() + " " + pattern));
                }
            }
        });
        return ops;
    }
}
