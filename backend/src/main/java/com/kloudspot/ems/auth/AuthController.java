package com.kloudspot.ems.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

/**
 * Lets the frontend check a username and password before storing them: with HTTP Basic there is
 * no separate login request, so the login page calls this endpoint and expects 200 or 401.
 */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Authentication", description = "Check the current HTTP Basic credentials")
public class AuthController {

    @GetMapping("/me")
    @Operation(summary = "Return the signed-in user", description = "200 with the username for valid credentials, otherwise 401.")
    @ApiResponse(responseCode = "200", description = "Credentials are valid")
    @ApiResponse(responseCode = "401", description = "Missing or invalid credentials")
    public CurrentUserResponse currentUser(Principal principal) {
        return new CurrentUserResponse(principal.getName());
    }

    public record CurrentUserResponse(String username) {
    }
}
