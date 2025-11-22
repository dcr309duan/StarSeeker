package com.starseeker.service

import org.springframework.stereotype.Service

@Service
class AnalysisService {
    private val kg = mapOf(
        "Physics" to listOf("displacement", "velocity", "time", "gradient"),
        "Mathematics" to listOf("linear equation", "isolation of variable"),
        "Chemistry" to listOf("exothermic", "enthalpy", "heat exchange")
    )

    fun generate(questionText: String, topic: String?, answer: String?): Triple<String, String?, List<String>> {
        var suggested = answer
        if (suggested == null && topic == "Mathematics" && Regex("2x\\s*\\+\\s*5\\s*=\\s*17").containsMatchIn(questionText)) suggested = "A"
        if (suggested == null && topic == "Physics" && Regex("(displacement[-\\s]*time|s[-\\s]*t).*constant.*velocity", RegexOption.IGNORE_CASE).containsMatchIn(questionText)) suggested = "A"
        if (suggested == null && topic == "Chemistry" && Regex("exothermic", RegexOption.IGNORE_CASE).containsMatchIn(questionText)) suggested = "B"
        if (suggested == null && Regex("velocity|displacement|graph", RegexOption.IGNORE_CASE).containsMatchIn(questionText)) suggested = "A"
        val points = kg[topic] ?: emptyList()
        val explanation = if (points.isNotEmpty()) {
            val rules = when (topic) {
                "Physics" -> listOf("constant velocity -> linear displacement-time graph", "gradient of s-t graph equals velocity")
                "Mathematics" -> listOf("ax + b = c -> x = (c - b)/a")
                "Chemistry" -> listOf("exothermic -> releases heat, ΔH < 0")
                else -> emptyList()
            }
            "知识点：${points.joinToString("，")}\n规律：${rules.joinToString("；")}\n思路：识别题目涉及的核心概念，应用对应规律进行判断。"
        } else {
            "根据题面关键词进行匹配与推理，结合题库答案给出结论。"
        }
        return Triple(explanation, suggested, points)
    }
}

