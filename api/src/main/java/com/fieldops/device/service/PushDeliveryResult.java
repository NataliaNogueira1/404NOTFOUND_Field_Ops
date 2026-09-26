package com.fieldops.device.service;

public record PushDeliveryResult(boolean accepted, boolean invalidToken) {
    public static PushDeliveryResult acceptedDelivery() { return new PushDeliveryResult(true, false); }
    public static PushDeliveryResult invalidTokenDelivery() { return new PushDeliveryResult(false, true); }
    public static PushDeliveryResult failedDelivery() { return new PushDeliveryResult(false, false); }
}
