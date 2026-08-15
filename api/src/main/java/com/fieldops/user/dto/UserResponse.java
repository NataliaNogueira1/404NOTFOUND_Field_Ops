package com.fieldops.user.dto;

import com.fieldops.user.model.Role;

/**
 * Public representation of a user. Never exposes {@code password}.
 */
public record UserResponse(Long id, String name, String email, Role role) {
}
