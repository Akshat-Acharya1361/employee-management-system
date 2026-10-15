package com.kloudspot.ems.employee;

import com.kloudspot.ems.employee.dto.EmployeeSearchCriteria;
import org.springframework.data.jpa.domain.Specification;

import java.util.Locale;

/**
 * Builds the WHERE clause for the employee list. Each filter is optional and
 * they are combined with AND, so search, department and status work together.
 */
public final class EmployeeSpecifications {

    private static final char LIKE_ESCAPE = '\\';

    private EmployeeSpecifications() {
    }

    public static Specification<Employee> matching(EmployeeSearchCriteria criteria) {
        Specification<Employee> specification = (root, query, builder) -> builder.conjunction();
        if (criteria.search() != null) {
            specification = specification.and(nameOrEmailContains(criteria.search()));
        }
        if (criteria.department() != null) {
            specification = specification.and(inDepartment(criteria.department()));
        }
        if (criteria.status() != null) {
            specification = specification.and(hasStatus(criteria.status()));
        }
        return specification;
    }

    static Specification<Employee> nameOrEmailContains(String searchText) {
        String pattern = "%" + escapeLikeWildcards(searchText.toLowerCase(Locale.ROOT)) + "%";
        return (root, query, builder) -> builder.or(
                builder.like(builder.lower(root.get("fullName")), pattern, LIKE_ESCAPE),
                // emails are stored in lower case already
                builder.like(root.get("email"), pattern, LIKE_ESCAPE));
    }

    static Specification<Employee> inDepartment(String department) {
        return (root, query, builder) -> builder.equal(root.get("department"), department);
    }

    static Specification<Employee> hasStatus(EmploymentStatus status) {
        return (root, query, builder) -> builder.equal(root.get("status"), status);
    }

    /** Treats user-typed % and _ as literal characters instead of SQL wildcards. */
    static String escapeLikeWildcards(String text) {
        return text.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
