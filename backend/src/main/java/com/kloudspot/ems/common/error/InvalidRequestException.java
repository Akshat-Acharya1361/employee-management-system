package com.kloudspot.ems.common.error;

/** A request that passed bean validation but breaks a business or query rule. */
public class InvalidRequestException extends RuntimeException {

    private final String field;

    public InvalidRequestException(String field, String message) {
        super(message);
        this.field = field;
    }

    public String getField() {
        return field;
    }
}
