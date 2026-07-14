package com.growkaro.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@EnableCaching
@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		System.out.println("Backend is Starting...");
		SpringApplication.run(BackendApplication.class, args);
		System.out.println("Backend is started successfully...");
	}

}
