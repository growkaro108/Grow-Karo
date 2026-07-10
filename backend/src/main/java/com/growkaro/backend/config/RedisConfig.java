package com.growkaro.backend.config;

import java.time.Duration;

import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.RedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;

@Configuration
@EnableCaching
public class RedisConfig {

        /**
         * Manual Redis access (used by RedisService for OTP get/set/delete, etc.)
         * Distinct from the @Cacheable/@CacheEvict annotation-driven caching below.
         */
        @Bean
        public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
                RedisTemplate<String, Object> template = new RedisTemplate<>();
                template.setConnectionFactory(connectionFactory);

                // Keys as plain strings (so "otp:signup:foo@bar.com" is human-readable in Redis
                // CLI)
                template.setKeySerializer(new StringRedisSerializer());
                template.setHashKeySerializer(new StringRedisSerializer());

                // Values as JSON so any Object (String, DTOs, etc.) can be stored consistently.
                // RedisSerializer.json() returns a GenericJackson2JsonRedisSerializer under the
                // hood.
                template.setValueSerializer(RedisSerializer.json());
                template.setHashValueSerializer(RedisSerializer.json());

                template.afterPropertiesSet();
                return template;
        }

        /**
         * Default configuration Spring Boot's autoconfigured RedisCacheManager
         * picks up for @Cacheable/@CacheEvict annotations.
         */
        @Bean
        public RedisCacheConfiguration cacheConfiguration() {
                return RedisCacheConfiguration.defaultCacheConfig()
                                .entryTtl(Duration.ofMinutes(10))
                                .disableCachingNullValues()
                                .serializeValuesWith(
                                                RedisSerializationContext.SerializationPair.fromSerializer(
                                                                RedisSerializer.json()));
        }
}