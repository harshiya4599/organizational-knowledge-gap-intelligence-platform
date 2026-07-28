package com.orgkgi.service;

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
import com.orgkgi.security.JwtTokenProvider;
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

@Service
public class AuthService {

    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtTokenProvider tokenProvider;
    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

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

    public String forgotPassword(String email) {
        // Do not reveal whether an account exists. If it does, create a token and persist it.
        userRepository.findByEmail(email).ifPresent(user -> {
            // remove any existing tokens for the user
            try {
                passwordResetTokenRepository.deleteByUser(user);
            } catch (Exception ignored) {}

            String token = UUID.randomUUID().toString();
            Instant expiry = Instant.now().plus(1, ChronoUnit.HOURS);
            PasswordResetToken prt = new PasswordResetToken(token, user, expiry);
            passwordResetTokenRepository.save(prt);

            // NOTE: sending the token via email is out of scope here. In production,
            // enqueue an email with a link like: https://example.com/reset-password?token={token}
        });

        return "If an account exists for this email, a password reset link has been sent.";
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
        return new LoginResponse("Login successful!", token);
    }

    public UserProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return new UserProfileResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole().getRoleName());
    }

    public UserProfileResponse updateProfile(String username, ProfileUpdateRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            user.setEmail(request.getEmail());
        }

        userRepository.save(user);
        return new UserProfileResponse(user.getId(), user.getUsername(), user.getEmail(), user.getRole().getRoleName());
    }
}