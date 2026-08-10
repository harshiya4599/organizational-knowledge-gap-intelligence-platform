package com.orgkgi.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Stores logged-out JWTs until their natural expiry. JWTs are otherwise stateless,
 * so this is required for logout to take effect immediately.
 */
@Service
public class TokenBlocklistService {

    private final Map<String, Date> blockedTokens = new ConcurrentHashMap<>();
    private final JwtTokenProvider tokenProvider;

    public TokenBlocklistService(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    public void block(String token) {
        if (!tokenProvider.validateToken(token)) {
            return;
        }
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(tokenProvider.getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
        blockedTokens.put(token, claims.getExpiration());
        removeExpiredTokens();
    }

    public boolean isBlocked(String token) {
        removeExpiredTokens();
        return blockedTokens.containsKey(token);
    }

    private void removeExpiredTokens() {
        Date now = new Date();
        blockedTokens.entrySet().removeIf(entry -> entry.getValue().before(now));
    }
}
