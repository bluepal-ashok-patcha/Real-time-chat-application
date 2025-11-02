package com.chatapp.apigateway.config;

import com.chatapp.apigateway.filter.JwtAuthenticationFilter;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class GatewayConfig {

    private final JwtAuthenticationFilter filter;

    public GatewayConfig(JwtAuthenticationFilter filter) {
        this.filter = filter;
    }

    @Bean
    public RouteLocator routes(RouteLocatorBuilder builder) {
        return builder.routes()
                .route("auth-service", r -> r.path("/api/auth/**", "/api/contacts/**", "/api/blocks/**")
                        .filters(f -> f.filter(filter))
                        .uri("lb://auth-service"))
                .route("chat-service", r -> r.path("/api/chat/**", "/api/groups/**")
                        .filters(f -> f.filter(filter))
                        .uri("lb://chat-service"))
                .build();
    }

}
