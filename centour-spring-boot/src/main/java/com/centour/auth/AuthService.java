package com.centour.auth;

import com.centour.security.JwtUtil;
import com.centour.user.UserRepository;
import com.centour.user.entity.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public String register(String email, String username, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalStateException("User already exists");
        }
        User saved = userRepository.save(new User(email, username, passwordEncoder.encode(password)));
        return saved.getId().toString();
    }

    // returns [accessToken, refreshToken]
    public String[] login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new IllegalArgumentException("Wrong password");
        }
        String userId = user.getId().toString();
        return new String[]{jwtUtil.generateAccessToken(userId), jwtUtil.generateRefreshToken(userId)};
    }

    public String refresh(String refreshToken) {
        if (!jwtUtil.validate(refreshToken)) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        return jwtUtil.generateAccessToken(jwtUtil.getUserId(refreshToken));
    }
}
