package com.orgkgi.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    @Bean
    public AccessDeniedHandler accessDeniedHandler() {
        return (request, response, accessDeniedException) -> {
            response.setStatus(403);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"status\":403,\"error\":\"Forbidden\",\"message\":\"You do not have permission to access this resource\"}"
            );
        };
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
                                                   CustomOAuth2UserService customOAuth2UserService,
                                                   OAuth2LoginSuccessHandler oAuth2LoginSuccessHandler) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exception ->
                        exception.accessDeniedHandler(accessDeniedHandler())
                )
                .authorizeHttpRequests(auth -> auth
                        // Authentication APIs
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/oauth2/**").permitAll()
                        // Role / Department management is restricted to admin users
                        .requestMatchers("/roles/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/departments/**").hasAuthority("ROLE_ADMIN")
                        .requestMatchers("/reports/**", "/api/reports/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_HR", "ROLE_DEPARTMENT_HEAD")
                        .requestMatchers("/notifications/send", "/api/notifications/send", "/notifications/reminders/**", "/api/notifications/reminders/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER", "ROLE_DEPARTMENT_HEAD")
                        .requestMatchers("/dashboard/**", "/api/dashboard/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER", "ROLE_DEPARTMENT_HEAD")
                        // Employee and skill module endpoints require authentication
                        .requestMatchers("/employees/**").authenticated()
                        .requestMatchers("/skills/**").authenticated()
                        .requestMatchers("/employee-skills/**").authenticated()
                        .requestMatchers("/competencies/**").authenticated()
                        .requestMatchers("/gap-analysis/**").authenticated()
                        .requestMatchers("/recommendations/**").authenticated()
                        .requestMatchers("/certifications/**").authenticated()
                        .requestMatchers("/education-history/**").authenticated()
                        .requestMatchers("/experiences/**").authenticated()
                        .requestMatchers("/peer-assessments/**").authenticated()
                        .requestMatchers("/assessments/**", "/api/assessments/**").authenticated()
                        .requestMatchers("/notifications/**", "/api/notifications/**").authenticated()
                        // Everything else requires JWT
                        .anyRequest().authenticated()
                );

        http.addFilterBefore(jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class);

        http.oauth2Login(oauth2 -> oauth2
                .userInfoEndpoint(userInfo -> userInfo.userService(customOAuth2UserService))
                .successHandler(oAuth2LoginSuccessHandler)
        );

        return http.build();
    }
}
    