package com.starseeker.api

import com.starseeker.model.SolveResponse
import com.starseeker.service.AnalysisService
import com.starseeker.service.OcrService
import com.starseeker.service.QuestionService
import org.slf4j.LoggerFactory
import org.springframework.http.MediaType
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/v1/api")
class QuestionController(
    private val ocr: OcrService,
    private val qs: QuestionService,
    private val analysis: AnalysisService
) {
    private val log = LoggerFactory.getLogger(QuestionController::class.java)
    @PostMapping("/solve", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE])
    fun solve(@RequestParam(required = false) board: String?, @RequestParam(required = false) force_text: String?, @RequestParam(required = false) image: MultipartFile?): ResponseEntity<SolveResponse> {
        val t0 = System.currentTimeMillis()
        log.info("solve start board={} imageSize={} forceTextLen={}", board ?: "AUTO", image?.size ?: 0, force_text?.length ?: 0)
        val rawText = when {
            !force_text.isNullOrBlank() -> force_text.trim()
            image != null && !image.isEmpty -> ocr.extractText(image.bytes)
            else -> ""
        }
        log.info("solve text length={}", rawText.length)
        if (rawText.isBlank()) return ResponseEntity.badRequest().build()
        val parsedQuestion = rawText
        val topic = qs.detectTopic(parsedQuestion)
        log.info("solve topic={}", topic ?: "UNKNOWN")
        val normalizedBoard = when (board?.uppercase()) { "EDEXCEL" -> "EDX"; "CIE", "EDX" -> board.uppercase(); else -> null }
        val match = qs.search(parsedQuestion, normalizedBoard)
        log.info("solve match id={} board={}", match?.id ?: "none", match?.board ?: normalizedBoard ?: "AUTO")
        val triple = analysis.generate(parsedQuestion, match?.subject ?: topic, match?.answer)
        val resp = SolveResponse(
            board = match?.board ?: normalizedBoard ?: "UNKNOWN",
            question = parsedQuestion,
            choices = match?.choices,
            matched = match?.let { mapOf("id" to it.id, "paper" to it.paper, "number" to it.number, "subject" to it.subject) },
            answer = match?.answer ?: triple.second,
            explanation = triple.first,
            knowledge_points = triple.third,
            duration_ms = System.currentTimeMillis() - t0
        )
        log.info("solve done durationMs={} answer={}", resp.duration_ms, resp.answer ?: "unknown")
        return ResponseEntity.ok(resp)
    }
}
