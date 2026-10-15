package com.kloudspot.ems.employee;

import com.kloudspot.ems.employee.dto.EmployeeResponse;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class EmployeeCsvExporterTest {

    @Test
    void writesHeaderAndOneRowPerEmployee() {
        EmployeeResponse employeeRecord = new EmployeeResponse(1L, "EMP-001", "Sharma, Aarav", "aarav@example.com",
                "98260 11001", "Engineering", "Engineer \"II\"", LocalDate.of(2022, 7, 11),
                new BigDecimal("850000.00"), EmploymentStatus.ACTIVE, null, null);

        String csv = EmployeeCsvExporter.toCsv(List.of(employeeRecord));

        assertThat(csv.split("\r\n")).containsExactly(
                "Employee ID,Full Name,Email,Phone,Department,Designation,Date of Joining,Salary,Status",
                "EMP-001,\"Sharma, Aarav\",aarav@example.com,98260 11001,Engineering,\"Engineer \"\"II\"\"\",2022-07-11,850000.00,ACTIVE");
    }

    @Test
    void neutralisesSpreadsheetFormulaPrefixes() {
        assertThat(EmployeeCsvExporter.escapeCell("=SUM(A1:A9)")).isEqualTo("'=SUM(A1:A9)");
        assertThat(EmployeeCsvExporter.escapeCell("+91 98260 11001")).isEqualTo("'+91 98260 11001");
        assertThat(EmployeeCsvExporter.escapeCell("Plain")).isEqualTo("Plain");
    }
}
