package com.puneet.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "monitors")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Monitor {

    @Id
    @GeneratedValue
    @UuidGenerator
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, columnDefinition = "text")
    private String url;

    @Column(nullable = false, length = 10)
    @Builder.Default
    private String method = "GET";

    @Column(name = "expected_status_code", nullable = false)
    @Builder.Default
    private int expectedStatusCode = 200;

    @Column(name = "check_interval_sec", nullable = false)
    @Builder.Default
    private int checkIntervalSec = 60;

    @Column(name = "timeout_ms", nullable = false)
    @Builder.Default
    private int timeoutMs = 5000;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Monitor m)) return false;
        return id != null && id.equals(m.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}