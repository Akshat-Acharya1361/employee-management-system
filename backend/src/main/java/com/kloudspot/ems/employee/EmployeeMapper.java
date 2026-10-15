package com.kloudspot.ems.employee;

import com.kloudspot.ems.employee.dto.EmployeeRequest;
import com.kloudspot.ems.employee.dto.EmployeeResponse;

import java.util.Locale;

/**
 * Converts between the API DTOs and the entity, and owns the input
 * normalisation rules so duplicate checks and saved values always agree.
 */
public final class EmployeeMapper {

    private EmployeeMapper() {
    }

    public static String normalizeEmployeeCode(String employeeCode) {
        return employeeCode.trim().toUpperCase(Locale.ROOT);
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    public static Employee toNewEntity(EmployeeRequest request) {
        Employee employeeRecord = new Employee();
        employeeRecord.setEmployeeCode(normalizeEmployeeCode(request.employeeCode()));
        applyEditableFields(employeeRecord, request);
        return employeeRecord;
    }

    /** Copies every field except the Employee ID, which cannot change after creation. */
    public static void applyEditableFields(Employee employeeRecord, EmployeeRequest request) {
        employeeRecord.setFullName(request.fullName().trim());
        employeeRecord.setEmail(normalizeEmail(request.email()));
        employeeRecord.setPhone(request.phone().trim());
        employeeRecord.setDepartment(request.department().trim());
        employeeRecord.setDesignation(request.designation().trim());
        employeeRecord.setJoiningDate(request.joiningDate());
        employeeRecord.setSalary(request.salary());
        employeeRecord.setStatus(request.status());
    }

    public static EmployeeResponse toResponse(Employee employeeRecord) {
        return new EmployeeResponse(
                employeeRecord.getId(),
                employeeRecord.getEmployeeCode(),
                employeeRecord.getFullName(),
                employeeRecord.getEmail(),
                employeeRecord.getPhone(),
                employeeRecord.getDepartment(),
                employeeRecord.getDesignation(),
                employeeRecord.getJoiningDate(),
                employeeRecord.getSalary(),
                employeeRecord.getStatus(),
                employeeRecord.getCreatedAt(),
                employeeRecord.getUpdatedAt());
    }
}
