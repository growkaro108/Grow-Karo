package com.growkaro.backend.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LocalFileStorageService {

    @Value("${app.storage.local.base-path:}")
    private String basePath;

    @Value("${app.storage.local.base-url:}")
    private String baseUrl;

    public String store(MultipartFile file, String folder) {
        try {
            String extension = getExtension(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + extension;

            Path targetDir = Paths.get(basePath, folder);
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(fileName);
            file.transferTo(targetPath);

            return baseUrl + "/" + folder + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file locally", e);
        }
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
}
