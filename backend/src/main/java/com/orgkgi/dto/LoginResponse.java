package com.orgkgi.dto;

public class LoginResponse {

    private String token;
    private String message;
    private String role;

    public LoginResponse(String message, String token, String role) {
        this.message = message;
        this.token = token;
        this.role = role;
    }

    public String getToken() {
        return token;
    }

    public String getMessage() {
        return message;
    }

    public String getRole() { return role; }
}
