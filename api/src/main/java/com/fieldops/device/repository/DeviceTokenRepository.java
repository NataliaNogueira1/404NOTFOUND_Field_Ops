package com.fieldops.device.repository;

import com.fieldops.device.model.DeviceToken;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceTokenRepository extends JpaRepository<DeviceToken, Long> {
    Optional<DeviceToken> findByPushToken(String pushToken);
    List<DeviceToken> findAllByUserIdAndActiveTrue(Long userId);
}
