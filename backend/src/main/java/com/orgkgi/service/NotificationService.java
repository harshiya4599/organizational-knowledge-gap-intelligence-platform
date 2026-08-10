package com.orgkgi.service;

import com.orgkgi.entity.Employee;
import com.orgkgi.entity.Notification;
import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.repository.NotificationRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final EmployeeRepository employeeRepository;

    public NotificationService(NotificationRepository notificationRepository, EmployeeRepository employeeRepository) {
        this.notificationRepository = notificationRepository;
        this.employeeRepository = employeeRepository;
    }

    public Notification sendNotification(Long employeeId, String type, String message) {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Notification notification = new Notification();
        notification.setEmployee(employee);
        notification.setType(type);
        notification.setMessage(message);
        notification.setSent(true);
        return notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForEmployee(Long employeeId) {
        return notificationRepository.findByEmployeeId(employeeId);
    }

    public List<Notification> generateReminders(Long employeeId) {
        List<Notification> reminders = new ArrayList<>();
        reminders.add(sendNotification(employeeId, "TRAINING_DEADLINE", "Training deadline is approaching for your current learning plan."));
        reminders.add(sendNotification(employeeId, "RECOMMENDATION", "A new learning recommendation has been generated for you."));
        reminders.add(sendNotification(employeeId, "MENTORSHIP", "A mentorship reminder is ready for your development review."));
        reminders.add(sendNotification(employeeId, "PROGRESS", "Your learning progress has been updated."));
        return reminders;
    }

    /** Generates the four standard learning notifications for every employee. */
    public void generateRemindersForAllEmployees() {
        employeeRepository.findAll().forEach(employee -> generateReminders(employee.getId()));
    }
}
