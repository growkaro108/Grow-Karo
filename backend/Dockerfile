# Stage 1: Build Image (JDK 25)
FROM eclipse-temurin:25-jdk AS build

# Install Maven 3.9.9 binaries onto JDK 25
COPY --from=maven:3.9.9-eclipse-temurin-21 /usr/share/maven /usr/share/maven
COPY --from=maven:3.9.9-eclipse-temurin-21 /usr/local/bin/mvn-entrypoint.sh /usr/local/bin/mvn-entrypoint.sh
RUN ln -s /usr/share/maven/bin/mvn /usr/bin/mvn

WORKDIR /workspace

COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -q -DskipTests dependency:go-offline

COPY src ./src
RUN ./mvnw -q -DskipTests package

# Stage 2: Runtime Image (JRE 25)
FROM eclipse-temurin:25-jre
WORKDIR /app

RUN addgroup --system appgroup && adduser --system appuser --ingroup appgroup

# Copy the generated JAR directly from build
COPY --from=build /workspace/target/*.jar app.jar

USER appuser
EXPOSE 4000
ENV JAVA_OPTS=""

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]