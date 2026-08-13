package com.orgkgi.security;

import com.orgkgi.entity.Employee;
import com.orgkgi.entity.User;
import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmployeeAccessServiceTest {
    @Mock private EmployeeRepository employeeRepository;
    @Mock private UserRepository userRepository;
    @InjectMocks private EmployeeAccessService employeeAccessService;

    @Test
    void employeeCanAccessOnlyTheirLinkedEmployeeRecord() {
        User user = new User();
        user.setId(7L);
        Employee employee = new Employee();
        employee.setId(42L);
        when(userRepository.findByUsername("employee")).thenReturn(Optional.of(user));
        when(employeeRepository.findByUserId(7L)).thenReturn(Optional.of(employee));
        var auth = new UsernamePasswordAuthenticationToken("employee", null,
                List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")));

        assertDoesNotThrow(() -> employeeAccessService.requireAccess(42L, auth));
        assertThrows(AccessDeniedException.class, () -> employeeAccessService.requireAccess(99L, auth));
    }

    @Test
    void administrativeWorkforceRoleCanAccessEmployeeRecords() {
        var auth = new UsernamePasswordAuthenticationToken("hr", null,
                List.of(new SimpleGrantedAuthority("ROLE_HR")));

        assertDoesNotThrow(() -> employeeAccessService.requireAccess(99L, auth));
    }
}
