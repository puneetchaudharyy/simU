package com.puneet.backend.service;

import com.puneet.backend.dto.CreateMonitorRequest;
import com.puneet.backend.dto.MonitorResponse;
import com.puneet.backend.dto.UpdateMonitorRequest;
import com.puneet.backend.entity.Monitor;
import com.puneet.backend.entity.User;
import com.puneet.backend.exception.MonitorNotFoundException;
import com.puneet.backend.repository.MonitorRepository;
import com.puneet.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MonitorService {

    private final MonitorRepository monitorRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<MonitorResponse> listForUser(UUID userId) {
        return monitorRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(MonitorResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public MonitorResponse getForUser(UUID monitorId, UUID userId) {
        return MonitorResponse.from(findOwned(monitorId, userId));
    }

    @Transactional
    public MonitorResponse create(CreateMonitorRequest request, UUID userId) {
        // The access token already proved this user's identity; we just need
        // a managed reference to set as the FK owner.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Authenticated user no longer exists: " + userId));

        Monitor monitor = Monitor.builder()
                .user(user)
                .name(request.name())
                .url(request.url())
                .method(request.methodOrDefault())
                .expectedStatusCode(request.expectedStatusCodeOrDefault())
                .checkIntervalSec(request.checkIntervalSecOrDefault())
                .timeoutMs(request.timeoutMsOrDefault())
                .active(true)
                .build();

        return MonitorResponse.from(monitorRepository.save(monitor));
    }

    @Transactional
    public MonitorResponse update(UUID monitorId, UpdateMonitorRequest request, UUID userId) {
        Monitor monitor = findOwned(monitorId, userId);

        if (request.name() != null) monitor.setName(request.name());
        if (request.url() != null) monitor.setUrl(request.url());
        if (request.method() != null) monitor.setMethod(request.method());
        if (request.expectedStatusCode() != null) monitor.setExpectedStatusCode(request.expectedStatusCode());
        if (request.checkIntervalSec() != null) monitor.setCheckIntervalSec(request.checkIntervalSec());
        if (request.timeoutMs() != null) monitor.setTimeoutMs(request.timeoutMs());
        if (request.active() != null) monitor.setActive(request.active());

        return MonitorResponse.from(monitorRepository.save(monitor));
    }

    @Transactional
    public void delete(UUID monitorId, UUID userId) {
        Monitor monitor = findOwned(monitorId, userId);
        monitorRepository.delete(monitor);
    }

    /**
     * Looks up a monitor scoped to its owner in a single query, rather than
     * fetching by id and separately checking user_id in code. This means a
     * user probing another user's monitor id gets the same 404 as a
     * genuinely nonexistent id -- no separate 403 branch to leak existence.
     */
    private Monitor findOwned(UUID monitorId, UUID userId) {
        return monitorRepository.findByIdAndUserId(monitorId, userId)
                .orElseThrow(() -> new MonitorNotFoundException(monitorId));
    }
}
