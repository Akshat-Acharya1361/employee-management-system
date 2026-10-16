package com.kloudspot.ems.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    private static final String BASIC_AUTH = "basicAuth";

    @Bean
    public OpenAPI employeeManagementOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Employee Management API")
                        .version("1.0.0")
                        .description("REST API for creating, listing, searching, updating and deleting employee records. "
                                + "List endpoints use zero-based page numbers. All /api endpoints require HTTP Basic "
                                + "authentication: click Authorize and enter the administrator username and password."))
                .components(new Components().addSecuritySchemes(BASIC_AUTH,
                        new SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("basic")))
                .addSecurityItem(new SecurityRequirement().addList(BASIC_AUTH));
    }
}
