package com.starseeker.exception

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice
import org.slf4j.LoggerFactory

@RestControllerAdvice
class GlobalExceptionHandler {
    private val log = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)
    @ExceptionHandler(Exception::class)
    fun handle(e: Exception): ResponseEntity<Map<String, String>> {
        log.error("server error", e)
        return ResponseEntity.status(500).body(mapOf("error" to "服务器错误", "detail" to (e.message ?: "")))
    }
}
