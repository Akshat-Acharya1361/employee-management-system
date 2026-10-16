package com.kloudspot.ems.employee;

import com.kloudspot.ems.common.error.DuplicateResourceException;
import com.kloudspot.ems.config.SecurityConfig;
import com.kloudspot.ems.common.error.ResourceNotFoundException;
import com.kloudspot.ems.employee.dto.EmployeeRequest;
import com.kloudspot.ems.employee.dto.EmployeeResponse;
import com.kloudspot.ems.employee.dto.EmployeeSearchCriteria;
import com.kloudspot.ems.employee.dto.PageResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasItems;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Checks the HTTP contract (status codes, validation and error JSON) with the service mocked.
 * Runs as a signed-in user; authentication itself is covered by AuthSecurityTest.
 */
@WebMvcTest(EmployeeController.class)
@Import(SecurityConfig.class)
@WithMockUser(username = "admin", roles = "ADMIN")
class EmployeeControllerTest {

    private static final String VALID_EMPLOYEE_JSON = """
            {
              "employeeCode": "EMP-020",
              "fullName": "Riya Kapoor",
              "email": "riya.kapoor@example.com",
              "phone": "+91 98260 12345",
              "department": "Engineering",
              "designation": "Software Engineer",
              "joiningDate": "2024-09-02",
              "salary": 750000.00,
              "status": "ACTIVE"
            }
            """;

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmployeeService employeeService;

    @Test
    void createReturns201WithLocationHeader() throws Exception {
        when(employeeService.createEmployee(any(EmployeeRequest.class))).thenReturn(sampleResponse(42L));

        mockMvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(VALID_EMPLOYEE_JSON))
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", endsWith("/api/employees/42")))
                .andExpect(jsonPath("$.id").value(42))
                .andExpect(jsonPath("$.employeeCode").value("EMP-020"));
    }

    @Test
    void createReturns400WithFieldErrorsForInvalidInput() throws Exception {
        String invalidJson = """
                {
                  "employeeCode": "E",
                  "fullName": "",
                  "email": "not-an-email",
                  "phone": "12ab",
                  "department": "Engineering",
                  "designation": "Engineer",
                  "joiningDate": "2999-01-01",
                  "salary": -5,
                  "status": "ACTIVE"
                }
                """;

        mockMvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(invalidJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.fieldErrors[*].field",
                        hasItems("employeeCode", "fullName", "email", "phone", "joiningDate", "salary")));
        verifyNoInteractions(employeeService);
    }

    @Test
    void createReturns400ForUnknownEmploymentStatus() throws Exception {
        String unknownStatusJson = VALID_EMPLOYEE_JSON.replace("\"ACTIVE\"", "\"RETIRED\"");

        mockMvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(unknownStatusJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("status"))
                .andExpect(jsonPath("$.fieldErrors[0].message").value("Must be one of: ACTIVE, INACTIVE"));
    }

    @Test
    void createReturns409ForDuplicateEmail() throws Exception {
        when(employeeService.createEmployee(any(EmployeeRequest.class)))
                .thenThrow(new DuplicateResourceException("email", "An employee with email riya.kapoor@example.com already exists"));

        mockMvc.perform(post("/api/employees").contentType(MediaType.APPLICATION_JSON).content(VALID_EMPLOYEE_JSON))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.fieldErrors[0].field").value("email"));
    }

    @Test
    void getReturns404ForUnknownEmployee() throws Exception {
        when(employeeService.getEmployee(99L)).thenThrow(new ResourceNotFoundException("Employee with id 99 was not found"));

        mockMvc.perform(get("/api/employees/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Employee with id 99 was not found"))
                .andExpect(jsonPath("$.path").value("/api/employees/99"));
    }

    @Test
    void listPassesSearchFiltersPagingAndSortToService() throws Exception {
        when(employeeService.searchEmployees(any(EmployeeSearchCriteria.class), any(Pageable.class)))
                .thenReturn(new PageResponse<>(List.of(sampleResponse(1L)), 1, 5, 6, 2, false, true, "salary,desc"));

        mockMvc.perform(get("/api/employees")
                        .param("search", " riya ")
                        .param("department", "Engineering")
                        .param("status", "ACTIVE")
                        .param("page", "1")
                        .param("size", "5")
                        .param("sort", "salary,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].employeeCode").value("EMP-020"))
                .andExpect(jsonPath("$.totalElements").value(6));

        ArgumentCaptor<EmployeeSearchCriteria> criteriaCaptor = ArgumentCaptor.forClass(EmployeeSearchCriteria.class);
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(employeeService).searchEmployees(criteriaCaptor.capture(), pageableCaptor.capture());
        assertThat(criteriaCaptor.getValue())
                .isEqualTo(new EmployeeSearchCriteria("riya", "Engineering", EmploymentStatus.ACTIVE));
        assertThat(pageableCaptor.getValue().getPageNumber()).isEqualTo(1);
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(5);
    }

    @Test
    void listReturns400ForSortFieldOutsideAllowlist() throws Exception {
        mockMvc.perform(get("/api/employees").param("sort", "password,asc"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("sort"));
        verifyNoInteractions(employeeService);
    }

    @Test
    void listReturns400ForInvalidStatusFilter() throws Exception {
        mockMvc.perform(get("/api/employees").param("status", "SOMETIMES"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("status"));
    }

    private static EmployeeResponse sampleResponse(Long id) {
        return new EmployeeResponse(id, "EMP-020", "Riya Kapoor", "riya.kapoor@example.com", "+91 98260 12345",
                "Engineering", "Software Engineer", LocalDate.of(2024, 9, 2), new BigDecimal("750000.00"),
                EmploymentStatus.ACTIVE, null, null);
    }
}
