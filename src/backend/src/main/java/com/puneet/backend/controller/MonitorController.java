package com.puneet.backend.controller;

import com.puneet.backend.dto.CreateMonitorRequest;
import com.puneet.backend.dto.MonitorResponse;
import com.puneet.backend.dto.UpdateMonitorRequest;
import com.puneet.backend.security.UserPrincipal;
import com.puneet.backend.service.MonitorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Controller
@RequestMapping("/api/monitors")
@RequiredArgsConstructor
public class MonitorController {

    private final MonitorService monitorService;

    @GetMapping
    public List<MonitorResponse> listMonitors(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        return monitorService.listForUser(userPrincipal.getId());
    }

    @PostMapping
    public ResponseEntity<MonitorResponse> create(
            @Valid @RequestBody CreateMonitorRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(monitorService.create(request, principal.getId()));
    }

    @GetMapping("/{id}")
    public MonitorResponse get(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        return monitorService.getForUser(id, principal.getId());
    }

    @PatchMapping("/{id}")
    public MonitorResponse update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMonitorRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        return monitorService.update(id, request, principal.getId());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id, @AuthenticationPrincipal UserPrincipal principal) {
        monitorService.delete(id, principal.getId());
        return ResponseEntity.noContent().build();
    }
}
