package com.orgkgi.controller;

import com.orgkgi.entity.Notification;
import com.orgkgi.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/notifications", "/api/notifications"})
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping("/send")
    public ResponseEntity<Notification> sendNotification(@RequestBody Map<String, Object> payload) {
        Long employeeId = Long.valueOf(payload.get("employeeId").toString());
        String type = payload.get("type").toString();
        String message = payload.get("message").toString();
        return ResponseEntity.ok(notificationService.sendNotification(employeeId, type, message));
    }

    @GetMapping("/{employeeId}")
    public ResponseEntity<List<Notification>> getNotifications(@PathVariable Long employeeId) {
        return ResponseEntity.ok(notificationService.getNotificationsForEmployee(employeeId));
    }

    @PostMapping("/reminders/{employeeId}")
    public ResponseEntity<List<Notification>> generateReminders(@PathVariable Long employeeId) {
        return ResponseEntity.ok(notificationService.generateReminders(employeeId));
    }
}
