package com.orgkgi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class OrgkgiBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(OrgkgiBackendApplication.class, args);
	}

}
