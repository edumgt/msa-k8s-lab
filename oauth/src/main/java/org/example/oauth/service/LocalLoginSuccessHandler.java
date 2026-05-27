package org.example.oauth.service;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.example.oauth.model.User;
import org.example.oauth.repository.UserRepository;
import org.example.oauth.util.JwtUtil;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Duration;

@Component
public class LocalLoginSuccessHandler implements AuthenticationSuccessHandler {

    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final String successRedirectUri;
    private final boolean secureCookie;
    private final String sameSite;
    private final long tokenValidityMs;

    public LocalLoginSuccessHandler(
            JwtUtil jwtUtil,
            UserRepository userRepository,
            @Value("${app.auth.success-redirect-uri:http://localhost:9999/chat}") String successRedirectUri,
            @Value("${app.security.cookie.secure:false}") boolean secureCookie,
            @Value("${app.security.cookie.same-site:Lax}") String sameSite,
            @Value("${app.security.jwt.expiration-ms:3600000}") long tokenValidityMs
    ) {
        this.jwtUtil = jwtUtil;
        this.userRepository = userRepository;
        this.successRedirectUri = successRedirectUri;
        this.secureCookie = secureCookie;
        this.sameSite = sameSite;
        this.tokenValidityMs = tokenValidityMs;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();
        String email = userDetails.getUsername();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found: " + email));

        String token = jwtUtil.generateToken(email, user.getName());

        ResponseCookie cookie = ResponseCookie.from("JWT_TOKEN", token)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(sameSite)
                .path("/")
                .maxAge(Duration.ofMillis(tokenValidityMs))
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        response.sendRedirect(successRedirectUri);
    }
}
