# ============================================
# Stage 1: Build the Spring Boot backend
# ============================================
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app
# Copy only pom.xml first to cache dependencies
COPY backend/pom.xml .
RUN mvn dependency:go-offline -q || true
# Copy source and build
COPY backend/src ./src
RUN mvn clean package -DskipTests -q

# ============================================
# Stage 2: Run the JAR
# ============================================
FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=builder /app/target/eventhandler-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8081

ENTRYPOINT ["java", "-jar", "app.jar"]