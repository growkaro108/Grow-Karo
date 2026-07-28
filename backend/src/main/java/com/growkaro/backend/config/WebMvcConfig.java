package com.growkaro.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * Serves locally stored uploads (bond images, etc.) as static resources.
 * Maps  GET /uploads/**  →  {app.storage.local.base-path}/**
 *
 * Works identically in:
 *   • local dev   (base-path = ./uploads)
 *   • Docker      (base-path = /app/uploads — set via env / docker-compose volume)
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.storage.local.base-path:./uploads}")
    private String basePath;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Resolve to absolute path so it works no matter where the JVM working dir is
        Path uploadDir = Paths.get(basePath).toAbsolutePath().normalize();
        String resourceLocation = "file:" + uploadDir + "/";

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
    }
}
