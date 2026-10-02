package com.fieldops.device.service;

public interface PushNotificationGateway {
    PushDeliveryResult send(String pushToken, Long inspectionId, String inspectionTitle);
}
