package com.fieldops.user.dto;

import com.fieldops.user.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateUserRequest(
        @NotBlank(message = "name is required")
        @Size(max = 100, message = "name must have at most 100 characters")
        String name,

        @NotBlank(message = "email is required")
        @Email(message = "email must be a valid email address")
        @Size(max = 150, message = "email must have at most 150 characters")
        String email,

        @NotBlank(message = "password is required")
        @Size(min = 6, max = 72, message = "password must have between 6 and 72 characters")
        String password,

        @NotNull(message = "role is required")
        Role role,

        @Size(max = 30, message = "phone must have at most 30 characters")
        String phone
) {
}
