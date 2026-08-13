package com.orgkgi.security;

import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.repository.UserRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service
public class EmployeeAccessService {
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public EmployeeAccessService(EmployeeRepository employeeRepository, UserRepository userRepository) {
        this.employeeRepository = employeeRepository;
        this.userRepository = userRepository;
    }

    public void requireAccess(Long employeeId, Authentication authentication) {
        if (!canAccess(employeeId, authentication)) {
            throw new AccessDeniedException("You do not have permission to access this employee's records");
        }
    }

    public boolean canAccess(Long employeeId, Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return false;
        if (authentication.getAuthorities().stream().anyMatch(authority ->
                authority.getAuthority().equals("ROLE_ADMIN") || authority.getAuthority().equals("ROLE_HR") ||
                authority.getAuthority().equals("ROLE_MANAGER") || authority.getAuthority().equals("ROLE_DEPARTMENT_HEAD"))) {
            return true;
        }
        return userRepository.findByUsername(authentication.getName())
                .flatMap(user -> employeeRepository.findByUserId(user.getId()))
                .map(employee -> employee.getId().equals(employeeId))
                .orElse(false);
    }

    public Long getEmployeeId(Authentication authentication) {
        return userRepository.findByUsername(authentication.getName())
                .flatMap(user -> employeeRepository.findByUserId(user.getId()))
                .map(employee -> employee.getId())
                .orElseThrow(() -> new AccessDeniedException("No employee profile is linked to this account"));
    }
}
