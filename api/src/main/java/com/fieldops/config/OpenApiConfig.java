package com.fieldops.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

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
                        .description("""
                                REST API for the FieldOps field-inspection platform.

                                Authenticate at `POST /api/v1/auth/login`, then send the returned \
                                access token as `Authorization: Bearer <token>`. Entity and \
                                inspection state diagrams are in `docs/api-diagrams.md`.""")
                        .version("v1")
                        .license(new License().name("Proprietary")))
                .servers(List.of(new Server().url("/").description("Current host")))
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
