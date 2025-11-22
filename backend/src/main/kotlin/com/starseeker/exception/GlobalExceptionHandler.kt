package com.starseeker.exception

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {
    @ExceptionHandler(Exception::class)
    fun handle(e: Exception): ResponseEntity<Map<String, String>> = ResponseEntity.status(500).body(mapOf("error" to "服务器错误", "detail" to (e.message ?: "")))
}

