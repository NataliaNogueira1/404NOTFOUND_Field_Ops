package com.fieldops.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Makes the Swagger UI reachable at both {@code /swagger-ui} and {@code /swagger-ui.html}.
 * springdoc registers a single welcome path; this adds a redirect alias for the conventional
 * {@code .html} URL so either entry point works.
 */
@Configuration
public class SwaggerUiRedirectConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addRedirectViewController("/swagger-ui.html", "/swagger-ui/index.html");
    }
}
