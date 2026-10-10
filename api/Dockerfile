# syntax=docker/dockerfile:1

# ---- build stage ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml .
RUN mvn -B -q dependency:go-offline
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---- runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /workspace/target/*-SNAPSHOT.jar app.jar
COPY docker-entrypoint.sh /usr/local/bin/fieldops-entrypoint
RUN chmod +x /usr/local/bin/fieldops-entrypoint

EXPOSE 8080
ENTRYPOINT ["/usr/local/bin/fieldops-entrypoint"]
