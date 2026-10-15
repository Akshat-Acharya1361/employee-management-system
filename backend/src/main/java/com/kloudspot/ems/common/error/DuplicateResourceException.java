package com.kloudspot.ems.common.error;

/** A unique value (Employee ID or email) is already used by another employee. */
public class DuplicateResourceException extends RuntimeException {

    private final String field;

    public DuplicateResourceException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
