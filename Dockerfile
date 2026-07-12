# ============================================
# Stage 1: Build the Spring Boot backend
# ============================================
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app
# Copy all backend files
COPY backend/pom.xml ./pom.xml
COPY backend/src ./src

# Build the JAR (package, not just compile)
RUN mvn clean package -DskipTests -B

# ============================================
# Stage 2: Run the JAR
# ============================================
FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /app/target/eventhandler-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]