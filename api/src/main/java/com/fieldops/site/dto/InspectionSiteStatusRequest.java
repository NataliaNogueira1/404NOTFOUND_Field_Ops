package com.fieldops.site.dto;

import com.fieldops.site.model.SiteStatus;
import jakarta.validation.constraints.NotNull;

public record InspectionSiteStatusRequest(
        @NotNull(message = "Status is required") SiteStatus status) {
}
