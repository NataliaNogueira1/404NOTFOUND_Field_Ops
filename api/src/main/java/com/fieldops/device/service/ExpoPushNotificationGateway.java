package com.fieldops.device.service;

import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Adapter for Expo's push API; disabled by default to keep local and test runs isolated. */
@Component
class ExpoPushNotificationGateway implements PushNotificationGateway {

    private final RestClient restClient;
    private final boolean enabled;

    ExpoPushNotificationGateway(
            @Value("${fieldops.push.expo-url:https://exp.host/--/api/v2/push/send}") String expoUrl,
            @Value("${fieldops.push.enabled:false}") boolean enabled) {
        this.restClient = RestClient.builder().baseUrl(expoUrl).build();
        this.enabled = enabled;
    }

    @Override
    public PushDeliveryResult send(String pushToken, Long inspectionId, String inspectionTitle) {
        if (!enabled) {
            return PushDeliveryResult.failedDelivery();
        }
        try {
            JsonNode response = restClient.post()
                    .body(Map.of("to", pushToken, "title", "New inspection assigned",
                            "body", inspectionTitle, "data", Map.of("inspectionId", inspectionId)))
                    .retrieve()
                    .body(JsonNode.class);
            String error = response == null ? "" : response.path("data").path(0).path("details").path("error").asText();
            return "DeviceNotRegistered".equals(error)
                    ? PushDeliveryResult.invalidTokenDelivery() : PushDeliveryResult.acceptedDelivery();
        } catch (RestClientException exception) {
            return PushDeliveryResult.failedDelivery();
        }
    }
}
