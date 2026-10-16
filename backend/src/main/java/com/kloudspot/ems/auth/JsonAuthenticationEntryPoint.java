package com.kloudspot.ems.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kloudspot.ems.common.error.ApiError;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;

import java.io.IOException;
import java.time.Instant;
import java.util.List;

/**
 * Answers unauthenticated requests with 401 in the same ApiError JSON shape as every other error.
 * It deliberately sends no WWW-Authenticate header, which stops browsers from opening their own
 * login pop-up; the frontend shows its own login page instead.
 */
public class JsonAuthenticationEntryPoint implements AuthenticationEntryPoint {

    static final String MESSAGE = "Invalid or missing username and password";

    private final ObjectMapper objectMapper;

    public JsonAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authenticationException) throws IOException {
        HttpStatus status = HttpStatus.UNAUTHORIZED;
        ApiError body = new ApiError(Instant.now(), status.value(), status.getReasonPhrase(), MESSAGE,
                request.getRequestURI(), List.of());
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), body);
    }
}
