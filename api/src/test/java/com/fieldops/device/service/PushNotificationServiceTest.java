package com.fieldops.device.service;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fieldops.device.model.DeviceToken;
import com.fieldops.device.repository.DeviceTokenRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PushNotificationServiceTest {

    @Mock
    private DeviceTokenRepository deviceTokenRepository;

    @Mock
    private PushNotificationGateway pushNotificationGateway;

    @InjectMocks
    private PushNotificationService pushNotificationService;

    @Test
    void removesAnInvalidTokenAfterTheExpoProviderRejectsIt() {
        DeviceToken token = DeviceToken.active("ExponentPushToken[invalid]");
        when(deviceTokenRepository.findAllByUserIdAndActiveTrue(12L)).thenReturn(List.of(token));
        when(pushNotificationGateway.send(token.getPushToken(), 42L, "Inspection assigned"))
                .thenReturn(PushDeliveryResult.invalidTokenDelivery());

        pushNotificationService.notifyInspectionAssigned(12L, 42L, "Inspection assigned");

        verify(deviceTokenRepository).delete(token);
    }
}
