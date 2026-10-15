package com.kloudspot.ems.employee.dto;

import com.kloudspot.ems.employee.EmploymentStatus;

/**
 * Optional list filters. Blank values mean "no filter".
 *
 * @param search     case-insensitive text matched against full name and email
 * @param department exact department name
 * @param status     employment status
 */
public record EmployeeSearchCriteria(String search, String department, EmploymentStatus status) {

    public EmployeeSearchCriteria {
        search = blankToNull(search);
        department = blankToNull(department);
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
