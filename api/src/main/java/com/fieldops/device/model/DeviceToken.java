package com.fieldops.device.model;

import com.fieldops.user.model.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "device_tokens")
public class DeviceToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "push_token", nullable = false, unique = true, length = 255)
    private String pushToken;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private DevicePlatform platform;

    @Column(nullable = false)
    private boolean active;

    @Column(name = "last_seen_at", nullable = false)
    private Instant lastSeenAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    protected DeviceToken() {
    }

    public static DeviceToken register(User user, String pushToken, DevicePlatform platform) {
        DeviceToken token = new DeviceToken();
        token.user = user;
        token.pushToken = pushToken;
        token.platform = platform;
        token.active = true;
        token.lastSeenAt = Instant.now();
        token.createdAt = token.lastSeenAt;
        return token;
    }

    public static DeviceToken active(String pushToken) {
        DeviceToken token = new DeviceToken();
        token.pushToken = pushToken;
        token.active = true;
        return token;
    }

    public void refresh(User user, DevicePlatform platform) {
        this.user = user;
        this.platform = platform;
        this.active = true;
        this.lastSeenAt = Instant.now();
    }

    public Long getId() { return id; }
    public String getPushToken() { return pushToken; }
    public boolean isActive() { return active; }
}
