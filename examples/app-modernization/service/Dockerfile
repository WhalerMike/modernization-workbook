# Build context: examples/app-modernization (the Maven parent lives there).
#   docker build -f service/Dockerfile -t case-service .

FROM eclipse-temurin:21-jdk AS build
WORKDIR /src
COPY mvnw pom.xml ./
COPY .mvn .mvn
COPY service/pom.xml service/pom.xml
COPY migration/pom.xml migration/pom.xml
RUN chmod +x mvnw && ./mvnw -B -q -pl service -am dependency:go-offline
COPY service/src service/src
# Tests need embedded PostgreSQL binaries and run in CI, not in the image build.
RUN ./mvnw -B -q -pl service -am package -DskipTests \
 && cp service/target/case-service-*.jar /src/app.jar

FROM eclipse-temurin:21-jre
RUN groupadd --system app && useradd --system --gid app --no-create-home app
WORKDIR /app
COPY --from=build /src/app.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "/app/app.jar"]
