package com.kloudspot.ems.employee.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/**
 * Stable JSON shape for paged results (Spring's Page is not meant to be serialised directly).
 * {@code page} is zero-based.
 */
public record PageResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        String sort
) {

    public static <S, T> PageResponse<T> from(Page<S> sourcePage, Function<S, T> mapper, String sort) {
        return new PageResponse<>(
                sourcePage.getContent().stream().map(mapper).toList(),
                sourcePage.getNumber(),
                sourcePage.getSize(),
                sourcePage.getTotalElements(),
                sourcePage.getTotalPages(),
                sourcePage.isFirst(),
                sourcePage.isLast(),
                sort);
    }
}
