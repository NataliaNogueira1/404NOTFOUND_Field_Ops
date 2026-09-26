package com.fieldops.device.controller;

import com.fieldops.device.dto.DeviceRegistrationRequest;
import com.fieldops.device.dto.DeviceRegistrationResponse;
import com.fieldops.device.service.DeviceTokenService;
import com.fieldops.shared.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/devices")
@Tag(name = "Devices")
@SecurityRequirement(name = "bearer-jwt")
public class DeviceController {

    private final DeviceTokenService deviceTokenService;

    public DeviceController(DeviceTokenService deviceTokenService) {
        this.deviceTokenService = deviceTokenService;
    }

    @Operation(summary = "Register or refresh the current device push token")
    @ApiResponse(responseCode = "200", description = "Device token registered")
    @ApiResponse(responseCode = "401", description = "Authentication required")
    @PostMapping("/register")
    public ResponseEntity<DeviceRegistrationResponse> register(
            @Valid @RequestBody DeviceRegistrationRequest request,
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(deviceTokenService.register(user.getId(), request));
    }
}
