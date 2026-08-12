package br.com.fieldops.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

/**
 * Application entry point for the FieldOps REST API.
 */
@SpringBootApplication
@ConfigurationPropertiesScan
public class FieldOpsApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(FieldOpsApiApplication.class, args);
    }
}
