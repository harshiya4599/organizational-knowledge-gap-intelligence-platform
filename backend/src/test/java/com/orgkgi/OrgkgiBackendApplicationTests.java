package com.orgkgi;

import com.orgkgi.entity.Role;
import com.orgkgi.entity.User;
import com.orgkgi.repository.RoleRepository;
import com.orgkgi.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class OrgkgiBackendApplicationTests {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Test
    void contextLoads() {
    }

    @Test
    void setupAndVerifyTestUser() {
        Role role = roleRepository.findAll().stream().findFirst().orElseGet(() -> {
            Role r = new Role();
            r.setRoleName("ADMIN");
            r.setDescription("Administrator role");
            return roleRepository.save(r);
        });

        User user = userRepository.findByEmail("emp01@gmail.com").orElseGet(() -> {
            User u = new User();
            u.setUsername("emp01");
            u.setEmail("emp01@gmail.com");
            u.setPassword(passwordEncoder.encode("1234"));
            u.setRole(role);
            return userRepository.save(u);
        });

        System.out.println("USER EMAIL: " + user.getEmail());
        System.out.println("STORED HASH: " + user.getPassword());

        boolean matches = passwordEncoder.matches("1234", user.getPassword());
        System.out.println("MATCHES: " + matches);

        assertTrue(matches, "Password '1234' should match the stored hash for emp01@gmail.com");
    }

    @Test
    void verifyStoredUserPasswordHashMatchesRawPassword() {
        User user = userRepository.findByEmail("emp01@gmail.com")
                .orElseThrow(() -> new RuntimeException("Test user emp01@gmail.com not found"));

        assertTrue(passwordEncoder.matches("1234", user.getPassword()),
                "Stored hash should match raw password '1234'");
    }
}