package com.kloudspot.ems.employee.dto;

import com.kloudspot.ems.employee.EmploymentStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Body for creating or updating an employee. The service trims text fields,
 * upper-cases the Employee ID and lower-cases the email before saving.
 */
public record EmployeeRequest(

        @Schema(description = "Employee ID: 3-20 letters, digits or hyphens. Cannot be changed after creation.",
                example = "EMP-016")
        @NotBlank(message = "Employee ID is required")
        @Pattern(regexp = "^\\s*[A-Za-z0-9-]{3,20}\\s*$",
                message = "Employee ID must be 3-20 letters, digits or hyphens")
        String employeeCode,

        @Schema(example = "Riya Kapoor")
        @NotBlank(message = "Full name is required")
        @Size(max = 100, message = "Full name must be at most 100 characters")
        String fullName,

        @Schema(example = "riya.kapoor@example.com")
        @NotBlank(message = "Email is required")
        @Email(regexp = "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", message = "Email must be a valid address")
        @Size(max = 150, message = "Email must be at most 150 characters")
        String email,

        @Schema(description = "Optional leading +, then digits, spaces, hyphens or brackets; 7-15 digits in total.",
                example = "+91 98260 12345")
        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^\\s*(?=(?:\\D*\\d){7,15}\\D*$)\\+?[0-9()\\s-]+$",
                message = "Phone number must contain 7-15 digits and only +, spaces, hyphens or brackets")
        @Size(max = 20, message = "Phone number must be at most 20 characters")
        String phone,

        @Schema(example = "Engineering")
        @NotBlank(message = "Department is required")
        @Size(max = 60, message = "Department must be at most 60 characters")
        String department,

        @Schema(example = "Software Engineer")
        @NotBlank(message = "Designation is required")
        @Size(max = 80, message = "Designation must be at most 80 characters")
        String designation,

        @Schema(example = "2026-09-01")
        @NotNull(message = "Joining date is required")
        @PastOrPresent(message = "Joining date cannot be in the future")
        LocalDate joiningDate,

        @Schema(description = "Annual salary in INR, up to 2 decimal places.", example = "750000.00")
        @NotNull(message = "Salary is required")
        @DecimalMin(value = "0.00", message = "Salary cannot be negative")
        @Digits(integer = 10, fraction = 2, message = "Salary must have at most 10 digits and 2 decimal places")
        BigDecimal salary,

        @Schema(example = "ACTIVE")
        @NotNull(message = "Employment status is required")
        EmploymentStatus status
) {
}
