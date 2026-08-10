package com.orgkgi.config;

import com.orgkgi.entity.Role;
import com.orgkgi.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner seedRoles(RoleRepository roleRepository) {
        return args -> {
            createRoleIfMissing(roleRepository, "ROLE_ADMIN", "Administrator role");
            createRoleIfMissing(roleRepository, "ROLE_EMPLOYEE", "Employee role");
            createRoleIfMissing(roleRepository, "ROLE_MANAGER", "Manager role");
            createRoleIfMissing(roleRepository, "ROLE_HR", "Human resources role");
            createRoleIfMissing(roleRepository, "ROLE_DEPARTMENT_HEAD", "Department head role");
        };
    }

    private void createRoleIfMissing(RoleRepository roleRepository, String roleName, String description) {
        if (roleRepository.findByRoleName(roleName).isEmpty()) {
            Role role = new Role();
            role.setRoleName(roleName);
            role.setDescription(description);
            roleRepository.save(role);
        }
    }
}
