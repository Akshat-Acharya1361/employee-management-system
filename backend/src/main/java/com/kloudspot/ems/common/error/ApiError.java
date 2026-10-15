package com.kloudspot.ems.common.error;

import java.time.Instant;
import java.util.List;

/**
 * Single error body used by every endpoint, e.g.
 * <pre>
 * { "timestamp": "...", "status": 409, "error": "Conflict",
 *   "message": "An employee with this email already exists",
 *   "path": "/api/employees",
 *   "fieldErrors": [ { "field": "email", "message": "..." } ] }
 * </pre>
 */
public record ApiError(
        Instant timestamp,
        int status,
        String error,
        String message,
        String path,
        List<FieldErrorDetail> fieldErrors
) {
}
