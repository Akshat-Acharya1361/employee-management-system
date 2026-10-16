package com.kloudspot.ems.auth;

import com.kloudspot.ems.config.SecurityConfig;
import com.kloudspot.ems.employee.EmployeeController;
import com.kloudspot.ems.employee.EmployeeService;
import com.kloudspot.ems.employee.dto.EmployeeSearchCriteria;
import com.kloudspot.ems.employee.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks the real security configuration: HTTP Basic with the configured administrator
 * (local defaults admin / admin123), JSON 401 responses and CORS preflight.
 */
@WebMvcTest(controllers = {AuthController.class, EmployeeController.class})
@Import(SecurityConfig.class)
class AuthSecurityTest {

    private static final String FRONTEND_ORIGIN = "http://localhost:5173";

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmployeeService employeeService;

    @Test
    void rejectsRequestWithoutCredentialsWithJsonAndNoBrowserPopup() throws Exception {
        mockMvc.perform(get("/api/employees"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.message").value(JsonAuthenticationEntryPoint.MESSAGE))
                .andExpect(jsonPath("$.path").value("/api/employees"));
        verifyNoInteractions(employeeService);
    }

    @Test
    void rejectsWrongPassword() throws Exception {
        mockMvc.perform(get("/api/auth/me").with(httpBasic("admin", "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(header().doesNotExist(HttpHeaders.WWW_AUTHENTICATE));
    }

    @Test
    void rejectsUnknownUser() throws Exception {
        mockMvc.perform(get("/api/auth/me").with(httpBasic("someone", "admin123")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protectsWriteEndpointsToo() throws Exception {
        mockMvc.perform(delete("/api/employees/1"))
                .andExpect(status().isUnauthorized());
        verifyNoInteractions(employeeService);
    }

    @Test
    void returnsCurrentUserForValidCredentials() throws Exception {
        mockMvc.perform(get("/api/auth/me").with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("admin"));
    }

    @Test
    void allowsApiCallWithValidCredentialsAndCreatesNoSession() throws Exception {
        when(employeeService.searchEmployees(any(EmployeeSearchCriteria.class), any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(), 0, 10, 0, 0, true, true, "fullName,asc"));

        mockMvc.perform(get("/api/employees").with(httpBasic("admin", "admin123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0))
                .andExpect(header().doesNotExist(HttpHeaders.SET_COOKIE));
    }

    @Test
    void allowsCorsPreflightFromFrontendWithoutCredentials() throws Exception {
        mockMvc.perform(options("/api/employees")
                        .header(HttpHeaders.ORIGIN, FRONTEND_ORIGIN)
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "authorization"))
                .andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, FRONTEND_ORIGIN));
    }

    @Test
    void rejectsCorsPreflightFromUnknownOrigin() throws Exception {
        mockMvc.perform(options("/api/employees")
                        .header(HttpHeaders.ORIGIN, "http://evil.example")
                        .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
                .andExpect(status().isForbidden());
    }
}
