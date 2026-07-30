package com.orgkgi.security;

import com.orgkgi.entity.Role;
import com.orgkgi.entity.User;
import com.orgkgi.repository.RoleRepository;
import com.orgkgi.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;

@Service
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public CustomOAuth2UserService(UserRepository userRepository,
                                   RoleRepository roleRepository,
                                   PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oauth2User = super.loadUser(userRequest);
        String email = extractEmail(oauth2User.getAttributes());

        if (email == null || email.isBlank()) {
            throw new OAuth2AuthenticationException("Cannot obtain email from OAuth2 provider");
        }

        User user = userRepository.findByEmail(email).orElseGet(() -> registerNewOAuth2User(email));

        return new DefaultOAuth2User(
                Collections.singleton(new SimpleGrantedAuthority(user.getRole().getRoleName())),
                oauth2User.getAttributes(),
                "email"
        );
    }

    private String extractEmail(Map<String, Object> attributes) {
        if (attributes.containsKey("email")) {
            return String.valueOf(attributes.get("email"));
        }
        if (attributes.containsKey("emails")) {
            Object emails = attributes.get("emails");
            if (emails instanceof Iterable<?> iterable) {
                for (Object item : iterable) {
                    if (item instanceof Map<?, ?> map && map.containsKey("value")) {
                        return String.valueOf(map.get("value"));
                    }
                }
            }
        }
        return null;
    }

    private User registerNewOAuth2User(String email) {
        Role role = roleRepository.findByRoleName("ROLE_EMPLOYEE")
                .orElseThrow(() -> new RuntimeException("Default role ROLE_EMPLOYEE not found"));

        User user = new User();
        user.setUsername(email);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
        user.setRole(role);
        return userRepository.save(user);
    }
}
