'use strict'

const Tesseract = require('tesseract.js')

async function ocrImageToText(buffer) {
  const { data } = await Tesseract.recognize(buffer, 'eng', { logger: () => {} })
  const text = (data && data.text) ? data.text : ''
  return text.replace(/[\r\t]+/g, ' ').replace(/\n+/g, '\n').trim()
}

module.exports = { ocrImageToText }

