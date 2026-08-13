package com.orgkgi.dto;

public class UserProfileResponse {

    private Long id;
    private String username;
    private String email;
    private String role;
    private Long userId;
    private Long employeeId;
    private String name;
    private String phone;
    private String department;
    private String designation;

    public UserProfileResponse(Long id, Long userId, Long employeeId, String username, String email, String role,
                               String name, String phone, String department, String designation) {
        this.id = id;
        this.userId = userId;
        this.employeeId = employeeId;
        this.username = username;
        this.email = email;
        this.role = role;
        this.name = name;
        this.phone = phone;
        this.department = department;
        this.designation = designation;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public String getEmail() { return email; }
    public String getRole() { return role; }
    public Long getUserId() { return userId; }
    public Long getEmployeeId() { return employeeId; }
    public String getName() { return name; }
    public String getPhone() { return phone; }
    public String getDepartment() { return department; }
    public String getDesignation() { return designation; }
}
