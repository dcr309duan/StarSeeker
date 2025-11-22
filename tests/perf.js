'use strict'

const http = require('http')
const { spawn } = require('child_process')

function requestSolve(payload) {
  return new Promise((resolve, reject) => {
    const data = new URLSearchParams(payload).toString()
    const req = http.request({ hostname: 'localhost', port: 3000, path: '/api/solve', method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(data) } }, res => {
      let body = ''
      res.on('data', d => body += d)
      res.on('end', () => {
        try { resolve(JSON.parse(body)) } catch (e) { reject(e) }
      })
    })
    req.on('error', reject)
    req.write(data)
    req.end()
  })
}

async function main() {
  const server = spawn('node', ['server.js'], { stdio: ['ignore', 'inherit', 'inherit'] })
  await new Promise(r => setTimeout(r, 600))
  const t0 = Date.now()
  const res = await requestSolve({ board: 'CIE', force_text: 'Which graph shows the displacement-time relationship for constant non-zero velocity?\nA. A straight line with positive gradient\nB. A horizontal line\nC. A curve with increasing gradient\nD. A sine wave' })
  const t1 = Date.now()
  console.log('Response time:', t1 - t0, 'ms')
  console.log('Answer:', res.answer)
  console.log('Duration reported:', res.duration_ms, 'ms')
  if (!res.answer) {
    console.error('No answer returned')
    process.exitCode = 1
  }
  server.kill()
}

main().catch(err => { console.error(err); process.exitCode = 1 })

