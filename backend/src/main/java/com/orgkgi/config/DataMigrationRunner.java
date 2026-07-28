package com.orgkgi.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class DataMigrationRunner implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataMigrationRunner.class);

    private final JdbcTemplate jdbcTemplate;

    public DataMigrationRunner(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
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
    }
}
