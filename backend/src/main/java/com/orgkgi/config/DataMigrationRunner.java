package com.orgkgi.config;

import com.orgkgi.entity.User;
import com.orgkgi.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataMigrationRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataMigrationRunner(JdbcTemplate jdbcTemplate,
                               UserRepository userRepository,
                               PasswordEncoder passwordEncoder) {
        this.jdbcTemplate = jdbcTemplate;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        try {
            logger.info("Checking for NULL skill_name values to backfill...");
            int updated = jdbcTemplate.update(
                    "UPDATE skills SET skill_name = 'skill-' || id WHERE skill_name IS NULL"
            );
            if (updated > 0) {
                logger.info("Backfilled {} skills with generated names.", updated);
            } else {
                logger.info("No NULL skill_name values found.");
            }
        } catch (Exception ex) {
            logger.warn("DataMigrationRunner failed to backfill skills: {}", ex.getMessage());
        }

        migratePlainTextPasswords();
    }

    private void migratePlainTextPasswords() {
        int migrated = 0;

        for (User user : userRepository.findAll()) {
            String currentPassword = user.getPassword();
            if (currentPassword == null || currentPassword.isBlank()) {
                continue;
            }

            if (isAlreadyHashed(currentPassword)) {
                continue;
            }

            user.setPassword(passwordEncoder.encode(currentPassword));
            userRepository.save(user);
            migrated++;
            logger.info("Migrated password for user '{}' to BCrypt.", user.getUsername());
        }

        if (migrated > 0) {
            logger.info("Migrated {} user passwords to BCrypt.", migrated);
        } else {
            logger.info("No plain-text user passwords found to migrate.");
        }
    }

    private boolean isAlreadyHashed(String password) {
        return password.startsWith("$2a$") || password.startsWith("$2b$") || password.startsWith("$2y$");
    }
}
