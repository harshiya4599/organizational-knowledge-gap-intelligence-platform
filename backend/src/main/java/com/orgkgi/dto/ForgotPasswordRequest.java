package com.orgkgi.dto;

public class ForgotPasswordRequest {

    private String email;
    private String username;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUsernameOrEmail() {
        if (username != null && !username.isBlank()) {
            return username;
        }
        return email;
    }
}