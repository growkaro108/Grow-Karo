// package com.growkaro.backend.service;

// import java.io.IOException;
// import java.util.UUID;

// import org.springframework.beans.factory.annotation.Value;
// import org.springframework.stereotype.Service;
// import org.springframework.web.multipart.MultipartFile;

// import software.amazon.awssdk.core.sync.RequestBody;
// import software.amazon.awssdk.services.s3.S3Client;
// import software.amazon.awssdk.services.s3.model.PutObjectRequest;

// @Service
// public class S3FileStorageService {

// private final S3Client s3Client;

// @Value("${app.storage.s3.bucket}")
// private String bucket;

// @Value("${app.storage.s3.public-url-base}") // e.g.
// https://your-bucket.s3.ap-south-1.amazonaws.com
// private String publicUrlBase;

// public S3FileStorageService(S3Client s3Client) {
// this.s3Client = s3Client;
// }

// public String store(MultipartFile file, String folder) {
// try {
// String extension = getExtension(file.getOriginalFilename());
// String key = folder + "/" + UUID.randomUUID() + extension;

// PutObjectRequest request = PutObjectRequest.builder()
// .bucket(bucket)
// .key(key)
// .contentType(file.getContentType())
// .build();

// s3Client.putObject(request,
// RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

// return publicUrlBase + "/" + key;
// } catch (IOException e) {
// throw new RuntimeException("Failed to upload file to S3", e);
// }
// }

// private String getExtension(String originalFilename) {
// if (originalFilename == null || !originalFilename.contains(".")) {
// return "";
// }
// return originalFilename.substring(originalFilename.lastIndexOf('.'));
// }
// }
