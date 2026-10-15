package com.kloudspot.ems.employee;

import com.kloudspot.ems.common.error.ApiError;
import com.kloudspot.ems.employee.dto.EmployeeRequest;
import com.kloudspot.ems.employee.dto.EmployeeResponse;
import com.kloudspot.ems.employee.dto.EmployeeSearchCriteria;
import com.kloudspot.ems.employee.dto.PageResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * HTTP layer only: reads parameters, delegates to {@link EmployeeService}, and
 * chooses status codes. Errors are formatted by GlobalExceptionHandler.
 */
@RestController
@RequestMapping("/api/employees")
@Tag(name = "Employees", description = "Create, list, search, update and delete employee records")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @GetMapping
    @Operation(summary = "List employees",
            description = "Search, filters, paging and sorting can be combined. Pages are zero-based.")
    @ApiResponse(responseCode = "200", description = "A page of employees (empty content if nothing matches)")
    @ApiResponse(responseCode = "400", description = "Invalid page, size, sort or status",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public PageResponse<EmployeeResponse> listEmployees(
            @Parameter(description = "Case-insensitive text matched against full name and email")
            @RequestParam(name = "search", required = false) String search,
            @Parameter(description = "Exact department name, as returned by /api/employees/departments")
            @RequestParam(name = "department", required = false) String department,
            @Parameter(description = "ACTIVE or INACTIVE")
            @RequestParam(name = "status", required = false) EmploymentStatus status,
            @Parameter(description = "Zero-based page number")
            @RequestParam(name = "page", defaultValue = "0") int page,
            @Parameter(description = "Page size, 1-100")
            @RequestParam(name = "size", defaultValue = "10") int size,
            @Parameter(description = "field,direction. Fields: employeeCode, fullName, email, department, "
                    + "designation, joiningDate, salary, status. Direction: asc or desc.")
            @RequestParam(name = "sort", defaultValue = EmployeePaging.DEFAULT_SORT) String sort) {
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(search, department, status);
        return employeeService.searchEmployees(criteria, EmployeePaging.toPageable(page, size, sort));
    }

    @GetMapping("/departments")
    @Operation(summary = "List the distinct departments in use", description = "Used to fill the department filter.")
    public List<String> listDepartments() {
        return employeeService.listDepartments();
    }

    @GetMapping(value = "/export", produces = "text/csv")
    @Operation(summary = "Export employees as CSV",
            description = "Exports every employee matching the same search and filters as the list endpoint.")
    public ResponseEntity<String> exportEmployees(
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "department", required = false) String department,
            @RequestParam(name = "status", required = false) EmploymentStatus status,
            @RequestParam(name = "sort", defaultValue = EmployeePaging.DEFAULT_SORT) String sort) {
        EmployeeSearchCriteria criteria = new EmployeeSearchCriteria(search, department, status);
        List<EmployeeResponse> employees = employeeService.findAllMatching(criteria, EmployeePaging.toSort(sort));
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"employees.csv\"")
                .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
                .body(EmployeeCsvExporter.toCsv(employees));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get one employee by internal id")
    @ApiResponse(responseCode = "200", description = "The employee")
    @ApiResponse(responseCode = "404", description = "No employee with this id",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public EmployeeResponse getEmployee(@PathVariable("id") Long id) {
        return employeeService.getEmployee(id);
    }

    @PostMapping
    @Operation(summary = "Create an employee")
    @ApiResponse(responseCode = "201", description = "Created; Location header points to the new employee")
    @ApiResponse(responseCode = "400", description = "Validation failed",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "Employee ID or email already exists",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<EmployeeResponse> createEmployee(@Valid @RequestBody EmployeeRequest request) {
        EmployeeResponse createdEmployee = employeeService.createEmployee(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(createdEmployee.id())
                .toUri();
        return ResponseEntity.created(location).body(createdEmployee);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an employee", description = "Replaces all editable fields. Employee ID cannot change.")
    @ApiResponse(responseCode = "200", description = "The updated employee")
    @ApiResponse(responseCode = "400", description = "Validation failed or Employee ID changed",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "404", description = "No employee with this id",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "Email already used by another employee",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public EmployeeResponse updateEmployee(@PathVariable("id") Long id, @Valid @RequestBody EmployeeRequest request) {
        return employeeService.updateEmployee(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Operation(summary = "Delete an employee")
    @ApiResponse(responseCode = "204", description = "Deleted")
    @ApiResponse(responseCode = "404", description = "No employee with this id",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public void deleteEmployee(@PathVariable("id") Long id) {
        employeeService.deleteEmployee(id);
    }
}
