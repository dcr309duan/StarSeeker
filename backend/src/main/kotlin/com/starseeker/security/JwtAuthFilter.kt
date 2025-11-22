package com.starseeker.security

import jakarta.servlet.FilterChain
import jakarta.servlet.http.HttpServletRequest
import jakarta.servlet.http.HttpServletResponse
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource
import org.springframework.stereotype.Component
import org.springframework.web.filter.OncePerRequestFilter

@Component
class JwtAuthFilter(private val jwtService: JwtService) : OncePerRequestFilter() {
    override fun doFilterInternal(request: HttpServletRequest, response: HttpServletResponse, filterChain: FilterChain) {
        val auth = request.getHeader("Authorization")
        val token = if (auth != null && auth.startsWith("Bearer ")) auth.substring(7) else null
        val user = token?.let { jwtService.parseSubject(it) }
        if (user != null && SecurityContextHolder.getContext().authentication == null) {
            val authToken = UsernamePasswordAuthenticationToken(user, null, emptyList())
            authToken.details = WebAuthenticationDetailsSource().buildDetails(request)
            SecurityContextHolder.getContext().authentication = authToken
        }
        filterChain.doFilter(request, response)
    }
}

