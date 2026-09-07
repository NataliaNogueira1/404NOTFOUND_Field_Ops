package com.fieldops.user.dto;

import com.fieldops.user.model.Role;
import com.fieldops.user.model.UserStatus;

import java.time.Instant;

/**
 * Public representation of a user. Never exposes {@code password}.
 */
public record UserResponse(
        Long id,
        String name,
        String email,
        Role role,
        UserStatus status,
        String phone,
        Instant createdAt,
        Instant updatedAt,
        Long version
) {
}
