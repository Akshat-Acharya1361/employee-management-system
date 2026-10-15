package com.kloudspot.ems.employee;

import com.kloudspot.ems.common.error.InvalidRequestException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.Locale;
import java.util.Set;

/**
 * Turns the list query parameters into a {@link Pageable}.
 * <ul>
 *   <li>Page numbers are zero-based.</li>
 *   <li>Page size must be between 1 and {@value #MAX_PAGE_SIZE}.</li>
 *   <li>Sort is "field,direction" with field from {@link #SORTABLE_FIELDS}; the
 *       internal id is always added as a tie-breaker so rows never jump between
 *       pages when the main sort value is equal.</li>
 * </ul>
 */
public final class EmployeePaging {

    public static final int DEFAULT_PAGE_SIZE = 10;
    public static final int MAX_PAGE_SIZE = 100;
    public static final String DEFAULT_SORT = "fullName,asc";

    static final Set<String> SORTABLE_FIELDS = Set.of(
            "employeeCode", "fullName", "email", "department", "designation", "joiningDate", "salary", "status");

    private EmployeePaging() {
    }

    public static Pageable toPageable(int page, int size, String sort) {
        if (page < 0) {
            throw new InvalidRequestException("page", "Page number must be 0 or greater (pages are zero-based)");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new InvalidRequestException("size", "Page size must be between 1 and " + MAX_PAGE_SIZE);
        }
        return PageRequest.of(page, size, toSort(sort));
    }

    static Sort toSort(String sort) {
        String requestedSort = (sort == null || sort.isBlank()) ? DEFAULT_SORT : sort.trim();
        String[] parts = requestedSort.split(",");
        if (parts.length > 2) {
            throw new InvalidRequestException("sort", "Sort must look like 'field,asc' or 'field,desc'");
        }

        String field = parts[0].trim();
        if (!SORTABLE_FIELDS.contains(field)) {
            throw new InvalidRequestException("sort",
                    "Cannot sort by '" + field + "'. Allowed fields: " + String.join(", ", SORTABLE_FIELDS.stream().sorted().toList()));
        }

        Sort.Direction direction = parts.length == 2 ? parseDirection(parts[1]) : Sort.Direction.ASC;
        return Sort.by(direction, field).and(Sort.by(Sort.Direction.ASC, "id"));
    }

    private static Sort.Direction parseDirection(String value) {
        return switch (value.trim().toLowerCase(Locale.ROOT)) {
            case "asc" -> Sort.Direction.ASC;
            case "desc" -> Sort.Direction.DESC;
            default -> throw new InvalidRequestException("sort", "Sort direction must be 'asc' or 'desc'");
        };
    }
}
