package com.kloudspot.ems.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kloudspot.ems.auth.JsonAuthenticationEntryPoint;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * HTTP Basic authentication for a single administrator.
 * <ul>
 *   <li>Every /api/** request needs valid credentials; Swagger UI and the OpenAPI JSON stay public.</li>
 *   <li>Stateless: no session or cookie is created, the browser sends the Authorization header each time.
 *       Because nothing is stored in a cookie, CSRF protection is not needed and is disabled.</li>
 *   <li>Failed or missing credentials return 401 in the shared ApiError JSON format, without a
 *       WWW-Authenticate header, so browsers do not show their own login pop-up.</li>
 * </ul>
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
    private static final String LOCAL_DEFAULT_PASSWORD = "admin123";

    @Bean
    public SecurityFilterChain apiSecurityFilterChain(HttpSecurity http, ObjectMapper objectMapper) throws Exception {
        JsonAuthenticationEntryPoint entryPoint = new JsonAuthenticationEntryPoint(objectMapper);
        http
                .csrf(AbstractHttpConfigurer::disable)
                // Uses the CORS rules from CorsConfig (allowed origins, methods and headers).
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/swagger-ui.html", "/swagger-ui/**", "/v3/api-docs/**", "/error").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().denyAll())
                .httpBasic(basic -> basic.authenticationEntryPoint(entryPoint))
                .exceptionHandling(exceptions -> exceptions.authenticationEntryPoint(entryPoint));
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /** The administrator account, read from configuration; the password is kept only as a BCrypt hash. */
    @Bean
    public UserDetailsService administratorAccount(
            @Value("${app.security.admin-username:admin}") String username,
            @Value("${app.security.admin-password:" + LOCAL_DEFAULT_PASSWORD + "}") String password,
            PasswordEncoder passwordEncoder) {
        if (username.isBlank() || password.isBlank()) {
            throw new IllegalStateException("EMS_ADMIN_USERNAME and EMS_ADMIN_PASSWORD must not be blank");
        }
        if (LOCAL_DEFAULT_PASSWORD.equals(password)) {
            log.warn("Using the default local administrator password. Set EMS_ADMIN_PASSWORD outside local development.");
        }
        return new InMemoryUserDetailsManager(User.withUsername(username)
                .password(passwordEncoder.encode(password))
                .roles("ADMIN")
                .build());
    }
}
