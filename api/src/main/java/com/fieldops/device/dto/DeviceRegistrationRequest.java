package com.fieldops.device.dto;

import com.fieldops.device.model.DevicePlatform;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record DeviceRegistrationRequest(
        @NotBlank @Size(max = 255) String pushToken,
        @NotNull DevicePlatform platform) {
}
