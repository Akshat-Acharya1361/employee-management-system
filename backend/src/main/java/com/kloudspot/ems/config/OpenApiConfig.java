package com.kloudspot.ems.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI employeeManagementOpenApi() {
        return new OpenAPI().info(new Info()
                .title("Employee Management API")
                .version("1.0.0")
                .description("REST API for creating, listing, searching, updating and deleting employee records. "
                        + "List endpoints use zero-based page numbers."));
    }
}
