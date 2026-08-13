package com.orgkgi.service;

import com.orgkgi.dto.ForgotPasswordResponse;
import com.orgkgi.dto.LoginRequest;
import com.orgkgi.dto.LoginResponse;
import com.orgkgi.dto.ProfileUpdateRequest;
import com.orgkgi.dto.RegisterRequest;
import com.orgkgi.dto.RegisterResponse;
import com.orgkgi.dto.UserProfileResponse;
import com.orgkgi.entity.Role;
import com.orgkgi.entity.User;
import com.orgkgi.repository.RoleRepository;
import com.orgkgi.repository.UserRepository;
import com.orgkgi.repository.EmployeeRepository;
import com.orgkgi.repository.DepartmentRepository;
import com.orgkgi.entity.Employee;
import com.orgkgi.security.JwtTokenProvider;
import com.orgkgi.security.RoleName;
import com.orgkgi.entity.PasswordResetToken;
import com.orgkgi.repository.PasswordResetTokenRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private EmployeeRepository employeeRepository;
    @Autowired
    private DepartmentRepository departmentRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenProvider tokenProvider;
    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;
    @Autowired
    private EmailService emailService;

    public String authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsernameOrEmail(),
                        loginRequest.getPassword()
                )
        );
        SecurityContextHolder.getContext().setAuthentication(authentication);
        return tokenProvider.generateToken(authentication);
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(String usernameOrEmail) {
        String message = "If an account exists for this email or username, a password reset email has been sent.";

        userRepository.findByUsername(usernameOrEmail)
                .or(() -> userRepository.findByEmail(usernameOrEmail))
                .ifPresent(user -> {
                    try {
                        passwordResetTokenRepository.deleteByUser(user);
                    } catch (Exception ignored) {}

                    String token = UUID.randomUUID().toString();
                    Instant expiry = Instant.now().plus(1, ChronoUnit.HOURS);
                    PasswordResetToken prt = new PasswordResetToken(token, user, expiry);
                    passwordResetTokenRepository.save(prt);
                    emailService.sendPasswordResetEmail(user.getEmail(), token);
                });

        return new ForgotPasswordResponse(message);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = passwordResetTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid or expired password reset token."));

        if (resetToken.getExpiryDate().isBefore(Instant.now())) {
            passwordResetTokenRepository.delete(resetToken);
            throw new RuntimeException("Invalid or expired password reset token.");
        }

        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        passwordResetTokenRepository.delete(resetToken);
    }

    public User registerUser(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("Error: Username is already taken!");
        }
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Error: Email is already in use!");
        }
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));

        String strRole = registerRequest.getRole() != null ? registerRequest.getRole() : "ROLE_EMPLOYEE";
        Role role = roleRepository.findByRoleName(strRole)
                .orElseThrow(() -> new RuntimeException("Error: Role not found."));

        user.setRole(role);
        return userRepository.save(user);
    }

    public RegisterResponse register(RegisterRequest registerRequest) {
        User user = registerUser(registerRequest);
        Authentication authentication = new UsernamePasswordAuthenticationToken(
                user.getUsername(), null,
                java.util.Collections.singletonList(
                        new org.springframework.security.core.authority.SimpleGrantedAuthority(user.getRole().getRoleName())
                )
        );
        String token = tokenProvider.generateToken(authentication);
        return new RegisterResponse("User registered successfully!", token);
    }

    public void changePassword(String username, String oldPassword, String newPassword) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new RuntimeException("Old password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    public LoginResponse login(LoginRequest loginRequest) {
        String token = authenticateUser(loginRequest);
        User user = userRepository.findByUsername(loginRequest.getUsernameOrEmail())
                .or(() -> userRepository.findByEmail(loginRequest.getUsernameOrEmail()))
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new LoginResponse("Login successful!", token, RoleName.normalize(user.getRole().getRoleName()));
    }

    public UserProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return toProfileResponse(user);
    }

    public UserProfileResponse updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }

        Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);
        if (employee != null) {
            if (request.getName() != null && !request.getName().isBlank()) employee.setName(request.getName());
            if (request.getPhone() != null && !request.getPhone().isBlank()) employee.setPhone(request.getPhone());
            if (request.getDesignation() != null && !request.getDesignation().isBlank()) employee.setDesignation(request.getDesignation());
            if (request.getDepartment() != null && !request.getDepartment().isBlank()) {
                employee.setDepartment(departmentRepository.findByDepartmentName(request.getDepartment())
                        .orElseThrow(() -> new IllegalArgumentException("Department not found: " + request.getDepartment())));
            }
            employee.setEmail(user.getEmail());
            employeeRepository.save(employee);
        }
        userRepository.save(user);
        return toProfileResponse(user);
    }

    private UserProfileResponse toProfileResponse(User user) {
        Employee employee = employeeRepository.findByUserId(user.getId()).orElse(null);
        Long employeeId = employee == null ? null : employee.getId();
        return new UserProfileResponse(employeeId == null ? user.getId() : employeeId, user.getId(), employeeId,
                user.getUsername(), user.getEmail(), RoleName.normalize(user.getRole().getRoleName()),
                employee == null ? user.getUsername() : employee.getName(),
                employee == null ? null : employee.getPhone(),
                employee == null || employee.getDepartment() == null ? null : employee.getDepartment().getDepartmentName(),
                employee == null ? null : employee.getDesignation());
    }
}
