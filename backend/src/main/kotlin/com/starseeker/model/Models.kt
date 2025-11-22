package com.starseeker.model

data class Question(
    val id: Int,
    val board: String,
    val subject: String,
    val year: Int?,
    val paper: String?,
    val number: String?,
    val questionText: String,
    val choices: Map<String, String>?,
    val answer: String?,
    val officialExplanation: String?
)

data class SolveResponse(
    val board: String,
    val question: String,
    val choices: Map<String, String>?,
    val matched: Map<String, Any?>?,
    val answer: String?,
    val explanation: String,
    val knowledge_points: List<String>,
    val duration_ms: Long
)

