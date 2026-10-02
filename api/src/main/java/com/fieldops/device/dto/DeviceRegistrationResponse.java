package com.fieldops.device.dto;

import com.fieldops.device.model.DevicePlatform;

public record DeviceRegistrationResponse(Long id, DevicePlatform platform) {
}
