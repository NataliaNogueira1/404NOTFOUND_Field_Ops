package com.fieldops;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class FieldOpsApiApplicationTest {

    @Test
    void contextLoads() {
        // Verifies the Spring context starts with the test profile (H2).
    }
}
