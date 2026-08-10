package com.orgkgi.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NotificationScheduler {

    private final NotificationService notificationService;

    public NotificationScheduler(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    /** Sends the standard learning reminders daily at 09:00 server time. */
    @Scheduled(cron = "0 0 9 * * *")
    public void sendDailyLearningReminders() {
        notificationService.generateRemindersForAllEmployees();
    }
}
