'use strict'

function parseQuestionFromText(text) {
  const lines = text.split(/\n/).map(s => s.trim()).filter(Boolean)
  const choiceRegex = /^(A|B|C|D)[\.)\s]+(.+)/i
  const choices = {}
  let questionLines = []
  for (const ln of lines) {
    const m = ln.match(choiceRegex)
    if (m) {
      const key = m[1].toUpperCase()
      const val = m[2].trim()
      choices[key] = val
    } else {
      questionLines.push(ln)
    }
  }
  const question = questionLines.join(' ')

  let topic
  if (/velocity|displacement|graph/i.test(question)) topic = 'Physics'
  else if (/solve.*x|equation|algebra/i.test(question)) topic = 'Mathematics'
  else if (/exothermic|enthalpy|reaction/i.test(question)) topic = 'Chemistry'

  return { question, choices, topic }
}

module.exports = { parseQuestionFromText }

