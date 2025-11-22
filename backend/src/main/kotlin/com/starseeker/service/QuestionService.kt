package com.starseeker.service

import com.starseeker.model.Question
import com.starseeker.repo.QuestionRepository
import org.springframework.stereotype.Service
import org.slf4j.LoggerFactory

@Service
class QuestionService(private val repo: QuestionRepository) {
    private val log = LoggerFactory.getLogger(QuestionService::class.java)
    fun detectTopic(text: String): String? {
        return when {
            Regex("velocity|displacement|graph", RegexOption.IGNORE_CASE).containsMatchIn(text) -> "Physics"
            Regex("solve.*x|equation|algebra", RegexOption.IGNORE_CASE).containsMatchIn(text) -> "Mathematics"
            Regex("exothermic|enthalpy|reaction", RegexOption.IGNORE_CASE).containsMatchIn(text) -> "Chemistry"
            else -> null
        }
    }

    fun search(text: String, board: String?): Question? = repo.searchByText(text, board)
}
