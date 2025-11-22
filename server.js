'use strict'

const path = require('path')
const fs = require('fs')
const express = require('express')
const compression = require('compression')
const multer = require('multer')
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } })

const { ensureSchema, searchQuestionByText, insertHistory, listHistory, addFavorite, listFavorites } = require('./src/db/index')
const { ocrImageToText } = require('./src/ocr/ocr')
const { parseQuestionFromText } = require('./src/ocr/parser')
const { generateAnalysis } = require('./src/analysis/analysis')

const app = express()
app.use(compression())
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))

ensureSchema()

app.post('/api/solve', upload.single('image'), async (req, res) => {
  const t0 = Date.now()
  try {
    const board = (req.body.board || '').toUpperCase()
    const forceText = req.body.force_text
    let rawText
    if (forceText && typeof forceText === 'string' && forceText.trim().length > 0) {
      rawText = forceText.trim()
    } else {
      if (!req.file) return res.status(400).json({ error: '缺少试卷图片或文本' })
      rawText = await ocrImageToText(req.file.buffer)
    }

    const parsed = parseQuestionFromText(rawText)

    const qText = parsed.question || rawText
    const searchBoard = ['CIE', 'EDX', 'EDEXCEL'].includes(board) ? (board === 'EDEXCEL' ? 'EDX' : board) : undefined
    const match = searchQuestionByText(qText, searchBoard)
    const official = match || null

    const analysis = generateAnalysis({
      questionText: qText,
      choices: parsed.choices,
      board: official ? official.board : searchBoard,
      answer: official ? official.answer : null,
      topic: official ? official.subject : parsed.topic
    })

    const response = {
      board: official ? official.board : searchBoard || 'UNKNOWN',
      question: qText,
      choices: parsed.choices,
      matched: official ? { id: official.id, paper: official.paper, number: official.number, subject: official.subject } : null,
      answer: official ? official.answer : analysis.suggestedAnswer || null,
      explanation: analysis.explanation,
      knowledge_points: analysis.knowledgePoints,
      duration_ms: Date.now() - t0
    }

    insertHistory({
      board: response.board,
      question_text: response.question,
      answer: response.answer,
      duration_ms: response.duration_ms
    })

    res.json(response)
  } catch (err) {
    res.status(500).json({ error: '服务器错误', detail: String(err && err.message || err) })
  }
})

app.get('/api/history', (req, res) => {
  res.json({ items: listHistory() })
})

app.post('/api/favorite', (req, res) => {
  const { question_id, question_text, board, answer } = req.body || {}
  if (!question_text) return res.status(400).json({ error: '缺少题目内容' })
  addFavorite({ question_id: question_id || null, question_text, board: board || 'UNKNOWN', answer: answer || null })
  res.json({ ok: true })
})

app.get('/api/favorites', (req, res) => {
  res.json({ items: listFavorites() })
})

app.use(express.static(path.join(__dirname, 'static')))

app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    return res.status(400).json({ error: '图片上传失败', detail: err.code === 'LIMIT_FILE_SIZE' ? '图片大小超过限制（8MB）' : err.message })
  }
  if (err) return res.status(500).json({ error: '服务器错误', detail: String(err.message || err) })
  next()
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`StarSeeker 摘星搜题服务已启动 http://localhost:${port}`)
})
