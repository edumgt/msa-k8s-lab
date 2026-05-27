package org.example.oauth.config;

import org.example.oauth.service.CustomAuthenticationSuccessHandler;
import org.example.oauth.service.CustomLogoutHandler;
import org.example.oauth.service.CustomOAuth2UserService;
import org.example.oauth.service.LocalLoginSuccessHandler;
import org.example.oauth.service.LocalUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CustomOAuth2UserService customOAuth2UserService;
    private final CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler;
    private final CustomLogoutHandler customLogoutHandler;
    private final LocalUserDetailsService localUserDetailsService;
    private final LocalLoginSuccessHandler localLoginSuccessHandler;

    public SecurityConfig(
            CustomOAuth2UserService customOAuth2UserService,
            CustomAuthenticationSuccessHandler customAuthenticationSuccessHandler,
            CustomLogoutHandler customLogoutHandler,
            LocalUserDetailsService localUserDetailsService,
            LocalLoginSuccessHandler localLoginSuccessHandler
    ) {
        this.customOAuth2UserService = customOAuth2UserService;
        this.customAuthenticationSuccessHandler = customAuthenticationSuccessHandler;
        this.customLogoutHandler = customLogoutHandler;
        this.localUserDetailsService = localUserDetailsService;
        this.localLoginSuccessHandler = localLoginSuccessHandler;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public DaoAuthenticationProvider daoAuthenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(localUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .authenticationProvider(daoAuthenticationProvider())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/login", "/login/local", "/error", "/search").permitAll()
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form
                        .loginPage("/login")
                        .loginProcessingUrl("/login/local")
                        .usernameParameter("email")
                        .passwordParameter("password")
                        .successHandler(localLoginSuccessHandler)
                        .failureUrl("/login?error")
                        .permitAll()
                )
                .oauth2Login(oauth -> oauth
                        .loginPage("/login")
                        .userInfoEndpoint(userInfo -> userInfo
                                .userService(customOAuth2UserService)
                        )
                        .successHandler(customAuthenticationSuccessHandler)
                )
                .logout(logout -> logout
                        .logoutUrl("/logout")
                        .logoutSuccessUrl("/logout-success")
                        .invalidateHttpSession(true)
                        .deleteCookies("JWT_TOKEN")
                        .addLogoutHandler(customLogoutHandler)
                        .permitAll()
                );
        return http.build();
    }
}
