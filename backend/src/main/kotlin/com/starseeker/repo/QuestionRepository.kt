package com.starseeker.repo

import com.starseeker.model.Question
import org.springframework.stereotype.Repository

@Repository
class QuestionRepository {
    private val data = mutableListOf(
        Question(1, "CIE", "Physics", 2021, "P12", "Q3", "Which graph shows the displacement-time relationship for constant non-zero velocity?", mapOf("A" to "A straight line with positive gradient", "B" to "A horizontal line", "C" to "A curve with increasing gradient", "D" to "A sine wave"), "A", "For constant velocity, displacement increases linearly with time."),
        Question(2, "EDX", "Mathematics", 2020, "P1", "Q10", "Solve for x: 2x + 5 = 17", mapOf("A" to "6", "B" to "5", "C" to "7", "D" to "8"), "A", "2x = 12 so x = 6."),
        Question(3, "CIE", "Chemistry", 2019, "P22", "Q7", "Which statement about exothermic reactions is correct?", mapOf("A" to "They absorb heat from surroundings", "B" to "They release heat to surroundings", "C" to "They decrease temperature of system", "D" to "Enthalpy change is positive"), "B", "Exothermic reactions release heat; enthalpy change is negative.")
    )

    fun searchByText(text: String, board: String?): Question? {
        val t = text.lowercase()
        return data.firstOrNull { (board == null || it.board == board) && it.questionText.lowercase().contains(t.take(24)) }
    }

    fun listAll(): List<Question> = data.toList()
}

