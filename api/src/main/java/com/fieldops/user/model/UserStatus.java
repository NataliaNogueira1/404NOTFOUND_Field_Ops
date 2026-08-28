package com.fieldops.user.model;

/**
 * Account lifecycle. Only {@code ACTIVE} users may log in and hold valid sessions;
 * INACTIVE and BLOCKED authenticate to the same generic 401 as unknown users.
 */
public enum UserStatus {
    ACTIVE,
    INACTIVE,
    BLOCKED
}
