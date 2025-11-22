package com.starseeker.security

import io.jsonwebtoken.Jwts
import io.jsonwebtoken.SignatureAlgorithm
import io.jsonwebtoken.security.Keys
import org.springframework.stereotype.Service
import java.util.Date

@Service
class JwtService {
    private val key = Keys.secretKeyFor(SignatureAlgorithm.HS256)
    fun generateToken(subject: String): String = Jwts.builder().setSubject(subject).setExpiration(Date(System.currentTimeMillis() + 3600_000)).signWith(key).compact()
    fun parseSubject(token: String): String? = try { Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).body.subject } catch (e: Exception) { null }
}

