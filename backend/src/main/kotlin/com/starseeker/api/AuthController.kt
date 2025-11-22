package com.starseeker.api

import com.starseeker.security.JwtService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.slf4j.LoggerFactory

@RestController
@RequestMapping("/v1/api/auth")
class AuthController(private val jwtService: JwtService) {
    private val log = LoggerFactory.getLogger(AuthController::class.java)
    @PostMapping("/login")
    fun login(@RequestParam username: String, @RequestParam password: String): ResponseEntity<Map<String, String>> {
        if (username == "teacher" && password == "starseeker") {
            val token = jwtService.generateToken(username)
            log.info("login ok user={}", username)
            return ResponseEntity.ok(mapOf("token" to token))
        }
        log.warn("login failed user={}", username)
        return ResponseEntity.status(401).body(mapOf("error" to "Unauthorized"))
    }
}
