'use strict'

const lunr = require('lunr')

let QUESTIONS = []
let HISTORY = []
let FAVORITES = []
let idx

function ensureSchema() {
  if (QUESTIONS.length === 0) seedSampleQuestions()
  buildIndex()
}

function seedSampleQuestions() {
  QUESTIONS = [
    {
      id: 1,
      board: 'CIE', subject: 'Physics', year: 2021, paper: 'P12', number: 'Q3',
      question_text: 'Which graph shows the displacement-time relationship for constant non-zero velocity?',
      choices_json: JSON.stringify({ A: 'A straight line with positive gradient', B: 'A horizontal line', C: 'A curve with increasing gradient', D: 'A sine wave' }),
      answer: 'A',
      official_explanation: 'For constant velocity, displacement increases linearly with time. The graph is a straight line with constant gradient.'
    },
    {
      id: 2,
      board: 'EDX', subject: 'Mathematics', year: 2020, paper: 'P1', number: 'Q10',
      question_text: 'Solve for x: 2x + 5 = 17',
      choices_json: JSON.stringify({ A: '6', B: '5', C: '7', D: '8' }),
      answer: 'A',
      official_explanation: '2x = 12 so x = 6.'
    },
    {
      id: 3,
      board: 'CIE', subject: 'Chemistry', year: 2019, paper: 'P22', number: 'Q7',
      question_text: 'Which statement about exothermic reactions is correct?',
      choices_json: JSON.stringify({ A: 'They absorb heat from surroundings', B: 'They release heat to surroundings', C: 'They decrease temperature of system', D: 'Enthalpy change is positive' }),
      answer: 'B',
      official_explanation: 'Exothermic reactions release heat; enthalpy change is negative.'
    }
  ]
}

function buildIndex() {
  idx = lunr(function () {
    this.ref('id')
    this.field('question_text')
    this.field('board')
    for (const q of QUESTIONS) this.add(q)
  })
}

function searchQuestionByText(text, board) {
  const query = text.replace(/[^\w\s]/g, ' ').split(/\s+/).filter(Boolean).slice(0, 16).join(' ')
  const results = idx.search(query)
  for (const r of results) {
    const q = QUESTIONS.find(q => String(q.id) === String(r.ref))
    if (!q) continue
    if (board && q.board !== board) continue
    return q
  }
  const lower = text.toLowerCase()
  for (const q of QUESTIONS) {
    if (board && q.board !== board) continue
    if (q.question_text.toLowerCase().includes(lower.substring(0, Math.min(24, lower.length)))) return q
  }
  return undefined
}

function insertHistory({ board, question_text, answer, duration_ms }) {
  HISTORY.unshift({ id: HISTORY.length + 1, created_at: Date.now(), board, question_text, answer, duration_ms })
  if (HISTORY.length > 100) HISTORY.pop()
}

function listHistory() { return HISTORY.slice(0, 100) }

function addFavorite({ question_id, board, question_text, answer }) {
  FAVORITES.unshift({ id: FAVORITES.length + 1, created_at: Date.now(), question_id, board, question_text, answer })
  if (FAVORITES.length > 100) FAVORITES.pop()
}

function listFavorites() { return FAVORITES.slice(0, 100) }

module.exports = { ensureSchema, searchQuestionByText, insertHistory, listHistory, addFavorite, listFavorites }
