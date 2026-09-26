package com.fieldops.device.service;

import com.fieldops.device.dto.DeviceRegistrationRequest;
import com.fieldops.device.dto.DeviceRegistrationResponse;
import com.fieldops.device.model.DeviceToken;
import com.fieldops.device.repository.DeviceTokenRepository;
import com.fieldops.shared.exception.ResourceNotFoundException;
import com.fieldops.user.model.User;
import com.fieldops.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DeviceTokenService {
    private final DeviceTokenRepository deviceTokenRepository;
    private final UserRepository userRepository;

    public DeviceTokenService(DeviceTokenRepository deviceTokenRepository, UserRepository userRepository) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public DeviceRegistrationResponse register(Long userId, DeviceRegistrationRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        DeviceToken token = deviceTokenRepository.findByPushToken(request.pushToken().trim())
                .map(existing -> { existing.refresh(user, request.platform()); return existing; })
                .orElseGet(() -> DeviceToken.register(user, request.pushToken().trim(), request.platform()));
        DeviceToken saved = deviceTokenRepository.save(token);
        return new DeviceRegistrationResponse(saved.getId(), request.platform());
    }
}
