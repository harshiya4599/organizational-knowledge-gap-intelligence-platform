package com.orgkgi.security;

public final class RoleName {
    private RoleName() { }

    public static String normalize(String roleName) {
        if (roleName == null || roleName.isBlank()) return "ROLE_EMPLOYEE";
        return roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
    }
}
