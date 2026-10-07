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

    public String storeBytes(byte[] contents, String extension, String folder) {
        try {
            String fileName = UUID.randomUUID() + extension;
            Path targetDir = Paths.get(basePath, folder);
            Files.createDirectories(targetDir);

            Path targetPath = targetDir.resolve(fileName);
            Files.write(targetPath, contents);

            return baseUrl + "/" + folder + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file locally", e);
        }
    }

    /**
     * Deletes a file previously stored by store()/storeBytes(), given the URL they
     * returned.
     * Safe to call with null/blank or an already-deleted file.
     */
    public void delete(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        try {
            // 1. URL -> path relative to basePath
            String relative = fileUrl.trim();
            if (!baseUrl.isEmpty() && relative.startsWith(baseUrl)) {
                relative = relative.substring(baseUrl.length());
            }
            while (relative.startsWith("/")) {
                relative = relative.substring(1);
            }
            if (relative.isEmpty()) {
                return;
            }

            // 2. Never allow a path outside the storage root (blocks ../ tricks)
            Path root = Paths.get(basePath).toAbsolutePath().normalize();
            Path target = root.resolve(relative).normalize();
            if (!target.startsWith(root) || target.equals(root)) {
                throw new IllegalArgumentException("Invalid file path: " + fileUrl);
            }

            // 3. Delete; no error if already gone
            Files.deleteIfExists(target);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete file locally: " + fileUrl, e);
        }
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || !originalFilename.contains(".")) {
            return "";
        }
        return originalFilename.substring(originalFilename.lastIndexOf('.'));
    }
}