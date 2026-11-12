package com.fieldops.nonconformity.exception;

/** Raised when a critical non-conformity is submitted without evidence for its item. */
public class CriticalEvidenceRequiredException extends RuntimeException {

    public CriticalEvidenceRequiredException(String message) {
        super(message);
    }
}
