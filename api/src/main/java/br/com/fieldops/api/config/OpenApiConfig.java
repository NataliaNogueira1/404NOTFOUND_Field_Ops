package br.com.fieldops.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configures the OpenAPI 3 documentation served by springdoc.
 * Registers a global Bearer JWT scheme so protected routes can declare {@code @SecurityRequirement}.
 */
@Configuration
public class OpenApiConfig {

    static final String BEARER_JWT = "bearer-jwt";

    @Bean
    public OpenAPI fieldOpsOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("FieldOps API")
                        .description("REST API for the FieldOps field-inspection platform.")
                        .version("v1")
                        .license(new License().name("Proprietary")))
                .addSecurityItem(new SecurityRequirement().addList(BEARER_JWT))
                .components(new Components()
                        .addSecuritySchemes(BEARER_JWT, new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT")
                                .in(SecurityScheme.In.HEADER)
                                .name("Authorization")));
    }
}
