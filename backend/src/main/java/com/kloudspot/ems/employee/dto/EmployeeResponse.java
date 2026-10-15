package com.kloudspot.ems.employee.dto;

import com.kloudspot.ems.employee.EmploymentStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record EmployeeResponse(
        Long id,
        String employeeCode,
        String fullName,
        String email,
        String phone,
        String department,
        String designation,
        LocalDate joiningDate,
        BigDecimal salary,
        EmploymentStatus status,
        Instant createdAt,
        Instant updatedAt
) {
}
