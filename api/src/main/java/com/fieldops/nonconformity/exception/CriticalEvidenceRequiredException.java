package com.fieldops.nonconformity.exception;

import com.fieldops.shared.exception.BusinessException;

public class CriticalEvidenceRequiredException extends BusinessException {
    public CriticalEvidenceRequiredException() {
        super("CRITICAL_EVIDENCE_REQUIRED", "Critical non-conformities require evidence attached to the inspection item.");
    }
}
