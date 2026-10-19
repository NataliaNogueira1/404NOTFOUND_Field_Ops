package com.fieldops.device.service;

import com.fieldops.device.model.DeviceToken;
import com.fieldops.device.repository.DeviceTokenRepository;
import java.util.List;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class PushNotificationService {

    private final DeviceTokenRepository deviceTokenRepository;
    private final PushNotificationGateway pushNotificationGateway;

    public PushNotificationService(DeviceTokenRepository deviceTokenRepository,
            PushNotificationGateway pushNotificationGateway) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.pushNotificationGateway = pushNotificationGateway;
    }

    /** Sends the assignment notification to every active device and discards rejected tokens. */
    @Async
    public void notifyInspectionAssigned(Long technicianId, Long inspectionId, String inspectionTitle) {
        List<DeviceToken> tokens = deviceTokenRepository.findAllByUserIdAndActiveTrue(technicianId);
        for (DeviceToken token : tokens) {
            PushDeliveryResult result = pushNotificationGateway.send(token.getPushToken(), inspectionId, inspectionTitle);
            if (result.invalidToken()) {
                deviceTokenRepository.delete(token);
            }
        }
    }
}
