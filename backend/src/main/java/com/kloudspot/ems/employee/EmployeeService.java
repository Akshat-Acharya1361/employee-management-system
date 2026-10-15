package com.kloudspot.ems.employee;

import com.kloudspot.ems.common.error.DuplicateResourceException;
import com.kloudspot.ems.common.error.InvalidRequestException;
import com.kloudspot.ems.common.error.ResourceNotFoundException;
import com.kloudspot.ems.employee.dto.EmployeeRequest;
import com.kloudspot.ems.employee.dto.EmployeeResponse;
import com.kloudspot.ems.employee.dto.EmployeeSearchCriteria;
import com.kloudspot.ems.employee.dto.PageResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

/**
 * Business rules for employee records. Reads run in read-only transactions;
 * each write runs in its own transaction so a failed check leaves no partial change.
 */
@Service
@Transactional(readOnly = true)
public class EmployeeService {

    private final EmployeeRepository employeeRepository;

    public EmployeeService(EmployeeRepository employeeRepository) {
        this.employeeRepository = employeeRepository;
    }

    public PageResponse<EmployeeResponse> searchEmployees(EmployeeSearchCriteria criteria, Pageable pageable) {
        Page<Employee> workforcePage = employeeRepository.findAll(EmployeeSpecifications.matching(criteria), pageable);
        return PageResponse.from(workforcePage, EmployeeMapper::toResponse, describeSort(pageable.getSort()));
    }

    /** Every employee matching the filters, in the given order; used for CSV export. */
    public List<EmployeeResponse> findAllMatching(EmployeeSearchCriteria criteria, Sort sort) {
        return employeeRepository.findAll(EmployeeSpecifications.matching(criteria), sort).stream()
                .map(EmployeeMapper::toResponse)
                .toList();
    }

    public EmployeeResponse getEmployee(Long id) {
        return EmployeeMapper.toResponse(findExistingEmployee(id));
    }

    public List<String> listDepartments() {
        return employeeRepository.findDistinctDepartments();
    }

    @Transactional
    public EmployeeResponse createEmployee(EmployeeRequest request) {
        String employeeCode = EmployeeMapper.normalizeEmployeeCode(request.employeeCode());
        String email = EmployeeMapper.normalizeEmail(request.email());

        if (employeeRepository.existsByEmployeeCode(employeeCode)) {
            throw new DuplicateResourceException("employeeCode",
                    "An employee with Employee ID " + employeeCode + " already exists");
        }
        if (employeeRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("email", "An employee with email " + email + " already exists");
        }

        Employee savedEmployee = employeeRepository.save(EmployeeMapper.toNewEntity(request));
        return EmployeeMapper.toResponse(savedEmployee);
    }

    @Transactional
    public EmployeeResponse updateEmployee(Long id, EmployeeRequest request) {
        Employee employeeRecord = findExistingEmployee(id);

        String requestedCode = EmployeeMapper.normalizeEmployeeCode(request.employeeCode());
        if (!requestedCode.equals(employeeRecord.getEmployeeCode())) {
            throw new InvalidRequestException("employeeCode", "Employee ID cannot be changed after creation");
        }

        String email = EmployeeMapper.normalizeEmail(request.email());
        if (employeeRepository.existsByEmailAndIdNot(email, id)) {
            throw new DuplicateResourceException("email", "An employee with email " + email + " already exists");
        }

        EmployeeMapper.applyEditableFields(employeeRecord, request);
        // saveAndFlush so updatedAt is set and constraint errors surface inside this transaction
        Employee savedEmployee = employeeRepository.saveAndFlush(employeeRecord);
        return EmployeeMapper.toResponse(savedEmployee);
    }

    @Transactional
    public void deleteEmployee(Long id) {
        Employee employeeRecord = findExistingEmployee(id);
        employeeRepository.delete(employeeRecord);
    }

    private Employee findExistingEmployee(Long id) {
        return employeeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee with id " + id + " was not found"));
    }

    /** Echoes the primary sort back to the client, e.g. "fullName,asc" (the id tie-breaker is omitted). */
    private static String describeSort(Sort sort) {
        return sort.stream()
                .findFirst()
                .map(order -> order.getProperty() + "," + order.getDirection().name().toLowerCase(Locale.ROOT))
                .orElse(EmployeePaging.DEFAULT_SORT);
    }
}
