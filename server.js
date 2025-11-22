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

function rid() { return Math.random().toString(36).slice(2,8) + Date.now().toString(36) }

app.post('/api/solve', upload.single('image'), async (req, res) => {
  const t0 = Date.now()
  try {
    const board = (req.body.board || '').toUpperCase()
    const forceText = req.body.force_text
    const reqId = String(req.headers['x-request-id'] || rid())
    console.log(`[solve:${reqId}] start board=${board || 'AUTO'} file=${req.file ? (req.file.mimetype || 'unknown') + ':' + (req.file.size || 0) : 'none'} forceTextLen=${forceText ? forceText.length : 0}`)
    let rawText
    if (forceText && typeof forceText === 'string' && forceText.trim().length > 0) {
      rawText = forceText.trim()
    } else {
      if (!req.file) return res.status(400).json({ error: '缺少试卷图片或文本' })
      rawText = await ocrImageToText(req.file.buffer)
      console.log(`[solve:${reqId}] ocr done length=${rawText.length}`)
    }

    const parsed = parseQuestionFromText(rawText)
    console.log(`[solve:${reqId}] parsed choices=${Object.keys(parsed.choices || {}).length}`)

    const qText = parsed.question || rawText
    const searchBoard = ['CIE', 'EDX', 'EDEXCEL'].includes(board) ? (board === 'EDEXCEL' ? 'EDX' : board) : undefined
    const match = searchQuestionByText(qText, searchBoard)
    const official = match || null
    console.log(`[solve:${reqId}] search match=${official ? official.id : 'none'} board=${official ? official.board : (searchBoard || 'AUTO')}`)

    let analysis = null
    const pyUrl = process.env.PY_API_URL || 'http://localhost:8000'
    try {
      const fd = new URLSearchParams()
      if (searchBoard) fd.append('board', searchBoard)
      fd.append('force_text', qText)
      const pyResp = await fetch(`${pyUrl}/api/solve`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: fd.toString() })
      if (pyResp.ok) {
        const pyData = await pyResp.json()
        analysis = { suggestedAnswer: pyData.answer, explanation: pyData.explanation, knowledgePoints: pyData.knowledge_points }
        console.log(`[solve:${reqId}] py-backend used answer=${analysis.suggestedAnswer}`)
      }
    } catch (e) {
      console.warn(`[solve:${reqId}] py-backend unavailable`, String(e && e.message || e))
    }
    if (!analysis) {
      analysis = generateAnalysis({
        questionText: qText,
        choices: parsed.choices,
        board: official ? official.board : searchBoard,
        answer: official ? official.answer : null,
        topic: official ? official.subject : parsed.topic
      })
    }
    console.log(`[solve:${reqId}] analysis answer=${official ? official.answer : analysis.suggestedAnswer || 'unknown'}`)

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
    console.log(`[solve:${reqId}] done duration=${response.duration_ms}ms`)

    insertHistory({
      board: response.board,
      question_text: response.question,
      answer: response.answer,
      duration_ms: response.duration_ms
    })

    res.json(response)
  } catch (err) {
    console.error(`[solve] error`, err && err.stack ? err.stack : err)
    res.status(500).json({ error: '服务器错误', detail: String(err && err.message || err) })
  }
})

app.get('/api/history', (req, res) => {
  console.log(`[history] list`)
  res.json({ items: listHistory() })
})

app.post('/api/favorite', (req, res) => {
  const { question_id, question_text, board, answer } = req.body || {}
  if (!question_text) return res.status(400).json({ error: '缺少题目内容' })
  console.log(`[favorite] add id=${question_id || 'none'} board=${board || 'UNKNOWN'} answer=${answer || 'none'} textLen=${(question_text || '').length}`)
  addFavorite({ question_id: question_id || null, question_text, board: board || 'UNKNOWN', answer: answer || null })
  res.json({ ok: true })
})

app.get('/api/favorites', (req, res) => {
  console.log(`[favorite] list`)
  res.json({ items: listFavorites() })
})

app.use(express.static(path.join(__dirname, 'static')))

app.use((err, req, res, next) => {
  if (err && err.name === 'MulterError') {
    console.warn(`[upload] error code=${err.code} msg=${err.message}`)
    return res.status(400).json({ error: '图片上传失败', detail: err.code === 'LIMIT_FILE_SIZE' ? '图片大小超过限制（8MB）' : err.message })
  }
  if (err) return res.status(500).json({ error: '服务器错误', detail: String(err.message || err) })
  next()
})

const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`StarSeeker 摘星搜题服务已启动 http://localhost:${port}`)
})
