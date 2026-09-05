package com.fieldops.user.controller;

import com.fieldops.user.dto.CreateUserRequest;
import com.fieldops.user.dto.EmailAvailabilityResponse;
import com.fieldops.user.dto.UpdateUserRequest;
import com.fieldops.user.dto.UpdateUserStatusRequest;
import com.fieldops.user.dto.UserResponse;
import com.fieldops.user.model.Role;
import com.fieldops.user.model.UserStatus;
import com.fieldops.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@Validated
@RestController
@RequestMapping("/api/v1/users")
@PreAuthorize("hasAuthority('ADMINISTRATOR')")
@Tag(name = "Users")
@SecurityRequirement(name = "bearer-jwt")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @Operation(summary = "List users with filters, sorting, and pagination")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Paginated user list"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Administrator profile required")
    })
    @GetMapping
    public ResponseEntity<Page<UserResponse>> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(userService.list(name, role, status, pageable));
    }

    @Operation(summary = "Check whether an email can be assigned to a user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Email availability result"),
            @ApiResponse(responseCode = "400", description = "Invalid email"),
            @ApiResponse(responseCode = "403", description = "Administrator profile required")
    })
    @GetMapping("/email-availability")
    public ResponseEntity<EmailAvailabilityResponse> emailAvailability(
            @RequestParam @NotBlank(message = "email is required")
            @Email(message = "email must be a valid email address") String email,
            @RequestParam(required = false) Long excludeId) {
        return ResponseEntity.ok(new EmailAvailabilityResponse(
                userService.isEmailAvailable(email, excludeId)));
    }

    @Operation(summary = "Create a user")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "User created"),
            @ApiResponse(responseCode = "400", description = "Invalid user data"),
            @ApiResponse(responseCode = "403", description = "Administrator profile required"),
            @ApiResponse(responseCode = "422", description = "Email already in use")
    })
    @PostMapping
    public ResponseEntity<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        UserResponse created = userService.create(request);
        return ResponseEntity.created(URI.create("/api/v1/users/" + created.id())).body(created);
    }

    @Operation(summary = "Update a user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User updated"),
            @ApiResponse(responseCode = "400", description = "Invalid user data"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "422", description = "Email already in use")
    })
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> update(@PathVariable Long id,
                                               @Valid @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(userService.update(id, request));
    }

    @Operation(summary = "Activate or deactivate a user")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "User status updated"),
            @ApiResponse(responseCode = "400", description = "Invalid status"),
            @ApiResponse(responseCode = "404", description = "User not found"),
            @ApiResponse(responseCode = "422", description = "Unsupported status transition")
    })
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserResponse> updateStatus(@PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        return ResponseEntity.ok(userService.updateStatus(id, request.status()));
    }
}
