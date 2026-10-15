package com.kloudspot.ems.employee;

import com.kloudspot.ems.common.error.InvalidRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmployeePagingTest {

    @Test
    void buildsZeroBasedPageWithRequestedSortAndIdTieBreaker() {
        Pageable pageable = EmployeePaging.toPageable(2, 25, "salary,desc");

        assertThat(pageable.getPageNumber()).isEqualTo(2);
        assertThat(pageable.getPageSize()).isEqualTo(25);
        assertThat(pageable.getSort()).containsExactly(
                Sort.Order.desc("salary"),
                Sort.Order.asc("id"));
    }

    @Test
    void defaultsToFullNameAscendingWhenSortIsBlank() {
        assertThat(EmployeePaging.toSort(" ")).containsExactly(Sort.Order.asc("fullName"), Sort.Order.asc("id"));
    }

    @Test
    void defaultsDirectionToAscendingAndIgnoresCase() {
        assertThat(EmployeePaging.toSort("joiningDate")).containsExactly(Sort.Order.asc("joiningDate"), Sort.Order.asc("id"));
        assertThat(EmployeePaging.toSort("joiningDate,DESC")).containsExactly(Sort.Order.desc("joiningDate"), Sort.Order.asc("id"));
    }

    @Test
    void rejectsNegativePage() {
        assertThatThrownBy(() -> EmployeePaging.toPageable(-1, 10, null))
                .isInstanceOf(InvalidRequestException.class)
                .extracting("field").isEqualTo("page");
    }

    @ParameterizedTest
    @ValueSource(ints = {0, -5, 101})
    void rejectsPageSizeOutsideAllowedRange(int size) {
        assertThatThrownBy(() -> EmployeePaging.toPageable(0, size, null))
                .isInstanceOf(InvalidRequestException.class)
                .extracting("field").isEqualTo("size");
    }

    @ParameterizedTest
    @ValueSource(strings = {"password,asc", "id,asc", "createdAt,desc", "fullName;drop table employees"})
    void rejectsSortFieldsOutsideTheAllowlist(String sort) {
        assertThatThrownBy(() -> EmployeePaging.toSort(sort))
                .isInstanceOf(InvalidRequestException.class)
                .extracting("field").isEqualTo("sort");
    }

    @Test
    void rejectsUnknownSortDirection() {
        assertThatThrownBy(() -> EmployeePaging.toSort("fullName,sideways"))
                .isInstanceOf(InvalidRequestException.class)
                .hasMessageContaining("asc");
    }
}
