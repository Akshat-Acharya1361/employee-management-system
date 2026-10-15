package com.kloudspot.ems.employee;

import com.kloudspot.ems.employee.dto.EmployeeResponse;

import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Writes employee rows as RFC 4180 CSV. Values starting with =, +, - or @ are
 * prefixed with an apostrophe so spreadsheet apps do not run them as formulas.
 */
public final class EmployeeCsvExporter {

    private static final String HEADER =
            "Employee ID,Full Name,Email,Phone,Department,Designation,Date of Joining,Salary,Status";

    private EmployeeCsvExporter() {
    }

    public static String toCsv(List<EmployeeResponse> employees) {
        StringBuilder csv = new StringBuilder(HEADER).append("\r\n");
        for (EmployeeResponse employeeRecord : employees) {
            csv.append(toCsvRow(employeeRecord)).append("\r\n");
        }
        return csv.toString();
    }

    private static String toCsvRow(EmployeeResponse employeeRecord) {
        return Stream.of(
                        employeeRecord.employeeCode(),
                        employeeRecord.fullName(),
                        employeeRecord.email(),
                        employeeRecord.phone(),
                        employeeRecord.department(),
                        employeeRecord.designation(),
                        employeeRecord.joiningDate().toString(),
                        employeeRecord.salary().toPlainString(),
                        employeeRecord.status().name())
                .map(EmployeeCsvExporter::escapeCell)
                .collect(Collectors.joining(","));
    }

    static String escapeCell(String value) {
        String safeValue = value;
        if (!safeValue.isEmpty() && "=+-@".indexOf(safeValue.charAt(0)) >= 0) {
            safeValue = "'" + safeValue;
        }
        if (safeValue.contains(",") || safeValue.contains("\"") || safeValue.contains("\n") || safeValue.contains("\r")) {
            safeValue = "\"" + safeValue.replace("\"", "\"\"") + "\"";
        }
        return safeValue;
    }
}
