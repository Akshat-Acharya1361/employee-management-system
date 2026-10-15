package com.kloudspot.ems.employee;

import com.kloudspot.ems.common.error.DuplicateResourceException;
import com.kloudspot.ems.common.error.InvalidRequestException;
import com.kloudspot.ems.common.error.ResourceNotFoundException;
import com.kloudspot.ems.employee.dto.EmployeeRequest;
import com.kloudspot.ems.employee.dto.EmployeeResponse;
import com.kloudspot.ems.employee.dto.EmployeeSearchCriteria;
import com.kloudspot.ems.employee.dto.PageResponse;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeServiceTest {

    @Mock
    private EmployeeRepository employeeRepository;

    @InjectMocks
    private EmployeeService employeeService;

    @Nested
    class CreateEmployee {

        @Test
        void savesNormalisedEmployeeIdAndEmail() {
            EmployeeRequest request = sampleRequest("  emp-020 ", "  Riya.Kapoor@Example.COM ");
            when(employeeRepository.existsByEmployeeCode("EMP-020")).thenReturn(false);
            when(employeeRepository.existsByEmail("riya.kapoor@example.com")).thenReturn(false);
            when(employeeRepository.save(any(Employee.class))).thenAnswer(invocation -> {
                Employee toSave = invocation.getArgument(0);
                toSave.setId(42L);
                return toSave;
            });

            EmployeeResponse created = employeeService.createEmployee(request);

            ArgumentCaptor<Employee> savedCaptor = ArgumentCaptor.forClass(Employee.class);
            verify(employeeRepository).save(savedCaptor.capture());
            Employee saved = savedCaptor.getValue();
            assertThat(saved.getEmployeeCode()).isEqualTo("EMP-020");
            assertThat(saved.getEmail()).isEqualTo("riya.kapoor@example.com");
            assertThat(saved.getFullName()).isEqualTo("Riya Kapoor");
            assertThat(saved.getSalary()).isEqualByComparingTo("750000.00");
            assertThat(created.id()).isEqualTo(42L);
            assertThat(created.status()).isEqualTo(EmploymentStatus.ACTIVE);
        }

        @Test
        void rejectsDuplicateEmployeeId() {
            when(employeeRepository.existsByEmployeeCode("EMP-001")).thenReturn(true);

            assertThatThrownBy(() -> employeeService.createEmployee(sampleRequest("emp-001", "new.person@example.com")))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("EMP-001")
                    .extracting("field").isEqualTo("employeeCode");
            verify(employeeRepository, never()).save(any(Employee.class));
        }

        @Test
        void rejectsDuplicateEmailRegardlessOfCapitalisation() {
            when(employeeRepository.existsByEmployeeCode("EMP-030")).thenReturn(false);
            when(employeeRepository.existsByEmail("aarav.sharma@example.com")).thenReturn(true);

            assertThatThrownBy(() -> employeeService.createEmployee(sampleRequest("EMP-030", "AARAV.Sharma@Example.com")))
                    .isInstanceOf(DuplicateResourceException.class)
                    .extracting("field").isEqualTo("email");
            verify(employeeRepository, never()).save(any(Employee.class));
        }
    }

    @Nested
    class GetEmployee {

        @Test
        void returnsEmployeeWhenFound() {
            when(employeeRepository.findById(7L)).thenReturn(Optional.of(existingEmployee(7L, "EMP-007", "old@example.com")));

            EmployeeResponse found = employeeService.getEmployee(7L);

            assertThat(found.employeeCode()).isEqualTo("EMP-007");
            assertThat(found.email()).isEqualTo("old@example.com");
        }

        @Test
        void throwsNotFoundForUnknownId() {
            when(employeeRepository.findById(99L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.getEmployee(99L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("99");
        }
    }

    @Nested
    class UpdateEmployee {

        @Test
        void updatesEditableFields() {
            Employee existing = existingEmployee(5L, "EMP-005", "old@example.com");
            when(employeeRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(employeeRepository.existsByEmailAndIdNot("new.address@example.com", 5L)).thenReturn(false);
            when(employeeRepository.saveAndFlush(existing)).thenReturn(existing);

            EmployeeRequest request = new EmployeeRequest("emp-005", "Updated Name", "New.Address@example.com",
                    "+91 90000 00000", "Finance", "Analyst", LocalDate.of(2021, 1, 4),
                    new BigDecimal("910000.50"), EmploymentStatus.INACTIVE);

            EmployeeResponse updated = employeeService.updateEmployee(5L, request);

            assertThat(updated.fullName()).isEqualTo("Updated Name");
            assertThat(updated.email()).isEqualTo("new.address@example.com");
            assertThat(updated.department()).isEqualTo("Finance");
            assertThat(updated.salary()).isEqualByComparingTo("910000.50");
            assertThat(updated.status()).isEqualTo(EmploymentStatus.INACTIVE);
            assertThat(updated.employeeCode()).isEqualTo("EMP-005");
        }

        @Test
        void allowsKeepingTheSameEmail() {
            Employee existing = existingEmployee(5L, "EMP-005", "same@example.com");
            when(employeeRepository.findById(5L)).thenReturn(Optional.of(existing));
            when(employeeRepository.existsByEmailAndIdNot("same@example.com", 5L)).thenReturn(false);
            when(employeeRepository.saveAndFlush(existing)).thenReturn(existing);

            EmployeeResponse updated = employeeService.updateEmployee(5L, sampleRequest("EMP-005", "SAME@example.com"));

            assertThat(updated.email()).isEqualTo("same@example.com");
        }

        @Test
        void rejectsEmailUsedByAnotherEmployee() {
            when(employeeRepository.findById(5L)).thenReturn(Optional.of(existingEmployee(5L, "EMP-005", "old@example.com")));
            when(employeeRepository.existsByEmailAndIdNot("taken@example.com", 5L)).thenReturn(true);

            assertThatThrownBy(() -> employeeService.updateEmployee(5L, sampleRequest("EMP-005", "Taken@Example.com")))
                    .isInstanceOf(DuplicateResourceException.class)
                    .extracting("field").isEqualTo("email");
            verify(employeeRepository, never()).saveAndFlush(any(Employee.class));
        }

        @Test
        void rejectsChangingTheEmployeeId() {
            when(employeeRepository.findById(5L)).thenReturn(Optional.of(existingEmployee(5L, "EMP-005", "old@example.com")));

            assertThatThrownBy(() -> employeeService.updateEmployee(5L, sampleRequest("EMP-999", "old@example.com")))
                    .isInstanceOf(InvalidRequestException.class)
                    .extracting("field").isEqualTo("employeeCode");
            verify(employeeRepository, never()).saveAndFlush(any(Employee.class));
        }

        @Test
        void throwsNotFoundForUnknownId() {
            when(employeeRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.updateEmployee(404L, sampleRequest("EMP-404", "x@example.com")))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    class DeleteEmployee {

        @Test
        void deletesExistingEmployee() {
            Employee existing = existingEmployee(3L, "EMP-003", "kabir.mehta@example.com");
            when(employeeRepository.findById(3L)).thenReturn(Optional.of(existing));

            employeeService.deleteEmployee(3L);

            verify(employeeRepository).delete(existing);
        }

        @Test
        void throwsNotFoundAndDeletesNothingForUnknownId() {
            when(employeeRepository.findById(404L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> employeeService.deleteEmployee(404L))
                    .isInstanceOf(ResourceNotFoundException.class);
            verify(employeeRepository, never()).delete(any(Employee.class));
        }
    }

    @Nested
    class SearchEmployees {

        @Test
        void mapsRepositoryPageToPageResponse() {
            Pageable pageable = EmployeePaging.toPageable(1, 2, "joiningDate,desc");
            List<Employee> pageContent = List.of(
                    existingEmployee(3L, "EMP-003", "c@example.com"),
                    existingEmployee(4L, "EMP-004", "d@example.com"));
            when(employeeRepository.findAll(ArgumentMatchers.<Specification<Employee>>any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(pageContent, pageable, 5));

            PageResponse<EmployeeResponse> result = employeeService.searchEmployees(
                    new EmployeeSearchCriteria("example", "Engineering", EmploymentStatus.ACTIVE), pageable);

            assertThat(result.content()).extracting(EmployeeResponse::employeeCode).containsExactly("EMP-003", "EMP-004");
            assertThat(result.page()).isEqualTo(1);
            assertThat(result.size()).isEqualTo(2);
            assertThat(result.totalElements()).isEqualTo(5);
            assertThat(result.totalPages()).isEqualTo(3);
            assertThat(result.first()).isFalse();
            assertThat(result.last()).isFalse();
            assertThat(result.sort()).isEqualTo("joiningDate,desc");
        }

        @Test
        void returnsEmptyPageWhenNothingMatches() {
            Pageable pageable = EmployeePaging.toPageable(0, 10, null);
            when(employeeRepository.findAll(ArgumentMatchers.<Specification<Employee>>any(), any(Pageable.class)))
                    .thenReturn(new PageImpl<>(List.of(), pageable, 0));

            PageResponse<EmployeeResponse> result = employeeService.searchEmployees(
                    new EmployeeSearchCriteria("nobody", null, null), pageable);

            assertThat(result.content()).isEmpty();
            assertThat(result.totalElements()).isZero();
            assertThat(result.sort()).isEqualTo("fullName,asc");
        }
    }

    private static EmployeeRequest sampleRequest(String employeeCode, String email) {
        return new EmployeeRequest(employeeCode, "  Riya Kapoor ", email, "+91 98260 12345", "Engineering",
                "Software Engineer", LocalDate.of(2024, 9, 2), new BigDecimal("750000.00"), EmploymentStatus.ACTIVE);
    }

    private static Employee existingEmployee(Long id, String employeeCode, String email) {
        Employee employeeRecord = new Employee();
        employeeRecord.setId(id);
        employeeRecord.setEmployeeCode(employeeCode);
        employeeRecord.setFullName("Existing Person");
        employeeRecord.setEmail(email);
        employeeRecord.setPhone("+91 98260 00000");
        employeeRecord.setDepartment("Engineering");
        employeeRecord.setDesignation("Engineer");
        employeeRecord.setJoiningDate(LocalDate.of(2020, 1, 1));
        employeeRecord.setSalary(new BigDecimal("500000.00"));
        employeeRecord.setStatus(EmploymentStatus.ACTIVE);
        return employeeRecord;
    }
}
