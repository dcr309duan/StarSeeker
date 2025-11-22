async function solve() {
  const fileInput = document.getElementById('image')
  const file = fileInput.files[0]
  const board = document.getElementById('board').value
  const resultEl = document.getElementById('result')
  const btn = document.getElementById('solve')
  const fd = new FormData()

  if (!file) {
    resultEl.textContent = '请先选择试卷图片（支持 jpg/png）'
    return
  }

  let recognizedText = ''
  try {
    resultEl.textContent = '正在本地OCR识别图片文本…'
    const { data } = await Tesseract.recognize(file, 'eng')
    recognizedText = (data && data.text) ? data.text : ''
    recognizedText = recognizedText.replace(/[\r\t]+/g, ' ').replace(/\n+/g, '\n').trim()
  } catch (e) {
    resultEl.textContent = `本地OCR失败：${String(e && e.message || e)}。可重试或更换更清晰照片。`
    return
  }

  if (!recognizedText) {
    resultEl.textContent = '未从图片识别到有效文本，请更换更清晰照片或调整拍摄角度。'
    return
  }

  if (board) fd.append('board', board)
  fd.append('force_text', recognizedText)

  btn.disabled = true
  resultEl.textContent = '正在识别与解析，请稍候…'

  const t0 = performance.now()
  try {
    const resp = await fetch('/api/solve', { method: 'POST', body: fd })
    const t1 = performance.now()
    let data
    try {
      data = await resp.json()
    } catch (e) {
      throw new Error('服务器响应无法解析，请稍后再试')
    }

    if (!resp.ok) {
      const msg = data && (data.error || data.detail) ? `${data.error || ''} ${data.detail || ''}`.trim() : '服务处理失败'
      resultEl.textContent = `错误：${msg}`
      return
    }

    resultEl.textContent = `考试局：${data.board}\n识别耗时：${data.duration_ms}ms（端到端：${Math.round(t1 - t0)}ms）\n\n题目：\n${data.question}\n\n选项：\n${JSON.stringify(data.choices, null, 2)}\n\n答案：${data.answer}\n\n解析：\n${data.explanation}\n\n知识点：${(data.knowledge_points||[]).join('，')}`
    loadHistory()
  } catch (err) {
    resultEl.textContent = `请求失败：${String(err && err.message || err)}`
  } finally {
    btn.disabled = false
  }
}

async function loadHistory() {
  const resp = await fetch('/api/history')
  const data = await resp.json()
  const ul = document.getElementById('history')
  ul.innerHTML = ''
  for (const it of data.items) {
    const li = document.createElement('li')
    li.textContent = `${new Date(it.created_at).toLocaleString()} · ${it.board} · ${it.answer} · ${it.question_text?.slice(0, 60)}`
    ul.appendChild(li)
  }
}

async function loadFavorites() {
  const resp = await fetch('/api/favorites')
  const data = await resp.json()
  const ul = document.getElementById('favorites')
  ul.innerHTML = ''
  for (const it of data.items) {
    const li = document.createElement('li')
    li.textContent = `${new Date(it.created_at).toLocaleString()} · ${it.board} · ${it.answer} · ${it.question_text?.slice(0, 60)}`
    ul.appendChild(li)
  }
}

async function favorite() {
  const txt = document.getElementById('result').textContent
  if (!txt) return
  const lines = txt.split('\n')
  const boardLine = lines.find(l => l.startsWith('考试局')) || ''
  const board = boardLine.split('：')[1]?.trim() || 'UNKNOWN'
  const answerLine = lines.find(l => l.startsWith('答案')) || ''
  const answer = answerLine.split('：')[1]?.trim() || null
  const questionIdx = lines.indexOf('题目：')
  let question = ''
  if (questionIdx !== -1) {
    question = lines.slice(questionIdx + 1).join(' ').slice(0, 400)
  }
  await fetch('/api/favorite', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_text: question, board, answer }) })
  loadFavorites()
}

document.getElementById('solve').addEventListener('click', solve)
document.getElementById('fav').addEventListener('click', favorite)
loadHistory()
loadFavorites()
