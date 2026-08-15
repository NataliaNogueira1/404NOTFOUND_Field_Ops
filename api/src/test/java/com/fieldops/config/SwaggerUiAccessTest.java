package com.fieldops.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Locks the Swagger UI entry points so both /swagger-ui and /swagger-ui.html resolve
 * (each redirects to the real UI at /swagger-ui/index.html).
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class SwaggerUiAccessTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void redirectsFromBarePath() throws Exception {
        mockMvc.perform(get("/swagger-ui"))
                .andExpect(status().is3xxRedirection());
    }

    @Test
    void redirectsFromHtmlPath() throws Exception {
        mockMvc.perform(get("/swagger-ui.html"))
                .andExpect(status().is3xxRedirection());
    }
}
