package com.starseeker.api

import com.starseeker.security.JwtService
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/v1/api/auth")
class AuthController(private val jwtService: JwtService) {
    @PostMapping("/login")
    fun login(@RequestParam username: String, @RequestParam password: String): ResponseEntity<Map<String, String>> {
        if (username == "teacher" && password == "starseeker") {
            val token = jwtService.generateToken(username)
            return ResponseEntity.ok(mapOf("token" to token))
        }
        return ResponseEntity.status(401).body(mapOf("error" to "Unauthorized"))
    }
}

