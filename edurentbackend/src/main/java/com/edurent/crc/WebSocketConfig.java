package com.edurent.crc;

import org.springframework.lang.NonNull;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Task scheduler for heartbeat functionality
    @Bean
    @NonNull
    public TaskScheduler heartBeatScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("wss-heartbeat-");
        scheduler.initialize();
        return scheduler;
    }

    // WebSocket configuration methods
    @Override
    public void configureMessageBroker(@NonNull MessageBrokerRegistry config) {
        // Configure heartbeat: [serverHeartbeat, clientHeartbeat] in milliseconds
        // 10000 = 10 seconds - server sends heartbeat every 10s, expects client
        // heartbeat every 10s
        config.enableSimpleBroker("/topic")
                .setHeartbeatValue(new long[] { 10000, 10000 })
                .setTaskScheduler(heartBeatScheduler());

        config.setApplicationDestinationPrefixes("/app");
    }

    // Register STOMP endpoints
    @Override
    public void registerStompEndpoints(@NonNull StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("http://localhost:5173", "http://localhost:3000", "http://localhost:4173",
                        "*")
                .withSockJS();
    }
}