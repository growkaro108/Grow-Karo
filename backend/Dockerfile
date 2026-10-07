# ==========================================
# Stage 1: Build Image
# ==========================================
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

# 1. Copy dependency definitions first to leverage Docker layer caching
COPY pom.xml ./
COPY .mvn/ .mvn/
COPY mvnw ./
RUN chmod +x mvnw

# 2. Download dependencies (Only re-runs if pom.xml changes)
RUN ./mvnw dependency:go-offline -B

# 3. Copy source code and build final executable JAR
COPY src ./src
RUN ./mvnw clean package -DskipTests -B && \
    # Ensure only the main spring-boot runnable jar is isolated
    mv target/*.jar target/app-exec.jar

# ==========================================
# Stage 2: Minimal Runtime Image
# ==========================================
FROM eclipse-temurin:21-jre-noble AS runtime
WORKDIR /app

# Create non-root system user and group
RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 --ingroup appgroup appuser

# Create required directory with permissions before switching user
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

# Copy optimized JAR from build stage
COPY --from=build --chown=appuser:appgroup /workspace/target/app-exec.jar /app/app.jar

USER appuser
EXPOSE 4000

# Keep heap and Metaspace within typical container budgets.
# -XX:+HeapDumpOnOutOfMemoryError: writes heap dump on OOM so you can diagnose leaks post-mortem
# -XX:+ExitOnOutOfMemoryError: immediately kills the container so orchestrator can restart it cleanly
ENV JAVA_OPTS="-Xms128m -Xmx512m -XX:+UseG1GC -XX:MaxMetaspaceSize=256m \
    -XX:+ExitOnOutOfMemoryError \
    -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/app/heapdump.hprof \
    -Xlog:gc*:file=/app/gc.log:time,level,tags:filecount=3,filesize=10m"

# Use shell form so $JAVA_OPTS is expanded at runtime
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
