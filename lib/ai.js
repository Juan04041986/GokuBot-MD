import { spawn } from 'child_process'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'

const MEMORY_TTL_MS = 30 * 60 * 1000
const MAX_SESSIONS = 250
const DEFAULT_MAX_HISTORY = 10

const memoryStore = new Map()
const botAiMessageIds = new Map()
const providerCooldowns = new Map()

function pruneMemory() {
  const now = Date.now()
  for (const [k, v] of memoryStore.entries()) {
    if (now - v.updatedAt > MEMORY_TTL_MS) memoryStore.delete(k)
  }
  while (memoryStore.size > MAX_SESSIONS) {
    const oldestKey = memoryStore.keys().next().value
    if (!oldestKey) break
    memoryStore.delete(oldestKey)
  }
  for (const [id, ts] of botAiMessageIds.entries()) {
    if (now - ts > 6 * 60 * 60 * 1000) botAiMessageIds.delete(id)
  }
  while (botAiMessageIds.size > 1000) {
    const oldestId = botAiMessageIds.keys().next().value
    if (!oldestId) break
    botAiMessageIds.delete(oldestId)
  }
}

export function rememberBotAiMessage(id) {
  if (!id || typeof id !== 'string') return
  pruneMemory()
  botAiMessageIds.set(id, Date.now())
}

export function isBotAiMessage(id) {
  if (!id || typeof id !== 'string') return false
  return botAiMessageIds.has(id)
}

export function getHistory(sessionKey) {
  pruneMemory()
  const entry = memoryStore.get(sessionKey)
  if (!entry) return []
  if (Date.now() - entry.updatedAt > MEMORY_TTL_MS) {
    memoryStore.delete(sessionKey)
    return []
  }
  return entry.messages.slice()
}

export function pushHistory(sessionKey, userText, assistantText, maxHistory = DEFAULT_MAX_HISTORY) {
  if (!sessionKey) return
  pruneMemory()
  const prev = getHistory(sessionKey)
  const next = [
    ...prev,
    { role: 'user', content: String(userText || '').slice(0, 1500) },
    { role: 'assistant', content: String(assistantText || '').slice(0, 1500) }
  ]
  const trimmed = next.length > maxHistory ? next.slice(next.length - maxHistory) : next
  memoryStore.set(sessionKey, { updatedAt: Date.now(), messages: trimmed })
}

export function clearMemory(sessionKey) {
  if (!sessionKey) return false
  return memoryStore.delete(sessionKey)
}

export function sanitizeAiText(raw) {
  if (!raw || typeof raw !== 'string') return ''
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/<\|[^|>]+\|>/g, '')
    .replace(/^\s+|\s+$/g, '')
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

function isCoolingDown(providerKey) {
  const until = providerCooldowns.get(providerKey) || 0
  return Date.now() < until
}

function setCooldown(providerKey, ms) {
  providerCooldowns.set(providerKey, Date.now() + ms)
}

async function callOpenAICompat({ key, url, model, messages, headers = {}, maxTokens = 900, temperature = 0.7, timeoutMs = 15000 }) {
  if (isCoolingDown(key)) {
    throw new Error(`${key} en enfriamiento`)
  }
  const body = { messages }
  if (model) body.model = model
  if (maxTokens) body.max_tokens = maxTokens
  if (typeof temperature === 'number') body.temperature = temperature

  const res = await fetchWithTimeout(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GokuBot-MD/2.5.6',
        ...headers
      },
      body: JSON.stringify(body)
    },
    timeoutMs
  )

  if (res.status === 402 || res.status === 429) {
    setCooldown(key, key.includes('pollinations') ? 46000 : 25000)
    throw new Error(`${key} limit (${res.status})`)
  }
  if (!res.ok) {
    const errBody = await res.text().catch(() => '')
    throw new Error(`${key} HTTP ${res.status}: ${errBody.slice(0, 120)}`)
  }

  const data = await res.json()
  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || ''
  const clean = sanitizeAiText(content)
  if (!clean) throw new Error(`${key} devolvió respuesta vacía`)
  return { text: clean, provider: key, model: model || 'default' }
}

async function callGeminiIfConfigured(messages, maxTokens = 900) {
  const apiKey = global.geminiKey || process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Sin Gemini API key')

  const systemMsg = messages.find((m) => m.role === 'system')?.content
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }))

  const body = {
    contents,
    generationConfig: { maxOutputTokens: maxTokens, temperature: 0.7 }
  }
  if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg }] }

  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    },
    15000
  )
  if (!res.ok) throw new Error(`gemini HTTP ${res.status}`)
  const data = await res.json()
  const text = sanitizeAiText(data?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('\n') || '')
  if (!text) throw new Error('gemini vacío')
  return { text, provider: 'gemini', model: 'gemini-2.5-flash' }
}

function getDefaultSystemPrompt(mode = 'chatgpt') {
  switch (mode) {
    case 'claude':
      return 'Eres Claude, un asistente de inteligencia artificial claro, analítico, amable y honesto integrado en GokuBot para WhatsApp. Responde siempre en español salvo que el usuario pida otro idioma, con formato limpio para WhatsApp.'
    case 'dolphin':
      return 'Eres Dolphin AI, un asistente directo, útil, versátil y sin rodeos innecesarios integrado en GokuBot para WhatsApp. Responde siempre en español salvo que el usuario pida otro idioma.'
    case 'gokuia':
      return 'Eres GokuBot IA, un asistente útil e inteligente con la energía amistosa de Son Goku (Dragon Ball). Ayudas de verdad con respuestas claras y precisas en español, con un toque alegre de Goku sin exagerar.'
    case 'chatbot':
      return 'Eres GokuBot, un chatbot de WhatsApp en español con la personalidad alegre, cercana y protectora de Son Goku de Dragon Ball. Responde de forma natural, breve (1 a 4 oraciones normalmente, o un poco más si te piden explicaciones), divertida y útil, siempre en español.'
    case 'gemini':
      return 'Eres Gemini AI integrado en GokuBot para WhatsApp. Responde siempre en español de forma clara, moderna y precisa.'
    default:
      return 'Eres un asistente de inteligencia artificial útil, claro y amigable integrado en GokuBot para WhatsApp. Responde siempre en español salvo que el usuario pida otro idioma, usando respuestas bien estructuradas para WhatsApp.'
  }
}

export async function askAI({ prompt, systemPrompt, history = [], mode = 'chatgpt', maxTokens = 900 }) {
  const cleanPrompt = String(prompt || '').trim()
  if (!cleanPrompt) throw new Error('Falta el texto de la consulta.')

  const sys = systemPrompt || getDefaultSystemPrompt(mode)
  const messages = [
    { role: 'system', content: sys },
    ...history.filter((h) => h && (h.role === 'user' || h.role === 'assistant') && h.content),
    { role: 'user', content: cleanPrompt }
  ]

  const providers = []

  const openaiKey = global.openaiKey || process.env.OPENAI_API_KEY
  if (openaiKey) {
    providers.push(() =>
      callOpenAICompat({
        key: 'openai-key',
        url: 'https://api.openai.com/v1/chat/completions',
        model: 'gpt-4o-mini',
        messages,
        headers: { Authorization: `Bearer ${openaiKey}` },
        maxTokens
      })
    )
  }

  const groqKey = global.groqKey || process.env.GROQ_API_KEY
  if (groqKey) {
    providers.push(() =>
      callOpenAICompat({
        key: 'groq-key',
        url: 'https://api.groq.com/openai/v1/chat/completions',
        model: 'llama-3.3-70b-versatile',
        messages,
        headers: { Authorization: `Bearer ${groqKey}` },
        maxTokens
      })
    )
  }

  if (global.geminiKey || process.env.GEMINI_API_KEY) {
    providers.push(() => callGeminiIfConfigured(messages, maxTokens))
  }

  const chatAtCall = () =>
    callOpenAICompat({
      key: 'ch.at',
      url: 'https://ch.at/v1/chat/completions',
      messages,
      timeoutMs: 14000
    })

  const ovhGptCall = () =>
    callOpenAICompat({
      key: 'ovh-gpt-oss',
      url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
      model: 'gpt-oss-120b',
      messages,
      maxTokens,
      timeoutMs: 16000
    })

  const ovhLlamaCall = () =>
    callOpenAICompat({
      key: 'ovh-llama',
      url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
      model: 'Meta-Llama-3_3-70B-Instruct',
      messages,
      maxTokens,
      timeoutMs: 18000
    })

  const ovhMistralCall = () =>
    callOpenAICompat({
      key: 'ovh-mistral',
      url: 'https://oai.endpoints.kepler.ai.cloud.ovh.net/v1/chat/completions',
      model: 'Mistral-Small-3.2-24B-Instruct-2506',
      messages,
      maxTokens,
      timeoutMs: 16000
    })

  const llm7Call = () =>
    callOpenAICompat({
      key: 'llm7',
      url: 'https://api.llm7.io/v1/chat/completions',
      model: 'default',
      messages,
      maxTokens,
      timeoutMs: 14000
    })

  const pollinationsCall = () =>
    callOpenAICompat({
      key: 'pollinations-text',
      url: 'https://text.pollinations.ai/openai',
      model: 'openai-fast',
      messages,
      maxTokens,
      timeoutMs: 14000
    })

  if (mode === 'claude') {
    providers.push(ovhGptCall, chatAtCall, ovhLlamaCall, llm7Call, pollinationsCall)
  } else if (mode === 'dolphin') {
    providers.push(ovhMistralCall, chatAtCall, ovhGptCall, llm7Call, pollinationsCall)
  } else {
    providers.push(chatAtCall, ovhGptCall, llm7Call, ovhLlamaCall, ovhMistralCall, pollinationsCall)
  }

  const errors = []
  for (const run of providers) {
    try {
      return await run()
    } catch (err) {
      errors.push(err?.message || String(err))
    }
  }

  throw new Error(`No se pudo obtener respuesta de la IA en este momento. (${errors[0] || 'sin proveedores'})`)
}

export async function chatWithMemory({
  sessionKey,
  prompt,
  systemPrompt,
  mode = 'chatgpt',
  speakerName = '',
  quotedText = '',
  maxTokens = 900,
  maxHistory = DEFAULT_MAX_HISTORY
}) {
  const cleanPrompt = String(prompt || '').trim()
  const cleanQuoted = String(quotedText || '').trim()
  let fullUserInput = cleanPrompt

  if (cleanQuoted && cleanQuoted !== cleanPrompt) {
    const snippet = cleanQuoted.length > 600 ? cleanQuoted.slice(0, 600) + '...' : cleanQuoted
    fullUserInput = `[Mensaje citado]: "${snippet}"\n\n${cleanPrompt}`
  }

  if (speakerName) {
    fullUserInput = `[${speakerName}]: ${fullUserInput}`
  }

  const history = sessionKey ? getHistory(sessionKey) : []
  const result = await askAI({
    prompt: fullUserInput,
    systemPrompt,
    history,
    mode,
    maxTokens
  })

  if (sessionKey) {
    pushHistory(sessionKey, fullUserInput, result.text, maxHistory)
  }

  return result
}

function detectImageFormat(buf) {
  if (!Buffer.isBuffer(buf) || buf.length < 16) return null
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png'
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp'
  return null
}

async function convertBufferWithFfmpeg(inputBuffer, inExt, outExt, extraArgs = []) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const tmpIn = path.join(os.tmpdir(), `gokubot-${id}.${inExt}`)
  const tmpOut = path.join(os.tmpdir(), `gokubot-${id}.${outExt}`)
  await fs.writeFile(tmpIn, inputBuffer)
  try {
    await new Promise((resolve, reject) => {
      const proc = spawn('ffmpeg', ['-y', '-i', tmpIn, ...extraArgs, tmpOut], { stdio: 'ignore' })
      proc.on('error', reject)
      proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`))))
    })
    return await fs.readFile(tmpOut)
  } finally {
    await fs.unlink(tmpIn).catch(() => {})
    await fs.unlink(tmpOut).catch(() => {})
  }
}

async function generateImagePollinations(prompt) {
  if (isCoolingDown('pollinations-image')) {
    throw new Error('Pollinations imagen en enfriamiento')
  }
  const seed = Math.floor(Math.random() * 9999999) + 1
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}`
  const res = await fetchWithTimeout(
    url,
    { headers: { 'User-Agent': 'GokuBot-MD/2.5.6', Accept: 'image/*' } },
    28000
  )

  if (res.status === 402 || res.status === 429) {
    setCooldown('pollinations-image', 46000)
    throw new Error(`Pollinations rate limit (${res.status})`)
  }
  if (!res.ok) {
    throw new Error(`Pollinations HTTP ${res.status}`)
  }

  const buf = Buffer.from(await res.arrayBuffer())
  const mime = detectImageFormat(buf)
  if (!mime || buf.length < 4000) {
    throw new Error('Pollinations no devolvió una imagen válida')
  }
  return { buffer: buf, mime, provider: 'pollinations' }
}

async function translatePromptToEnglish(prompt) {
  try {
    const { text } = await askAI({
      prompt: `Translate and refine this image prompt into concise descriptive English for Stable Diffusion. Output ONLY the final English prompt, nothing else:\n\n${prompt}`,
      systemPrompt: 'You translate image generation prompts into clean English Stable Diffusion prompts. Return only the English prompt.',
      mode: 'chatgpt',
      maxTokens: 120
    })
    return text.replace(/^["']|["']$/g, '').trim() || prompt
  } catch {
    return prompt
  }
}

async function generateImageAiHorde(prompt) {
  const enPrompt = await translatePromptToEnglish(prompt)
  const headers = {
    'Content-Type': 'application/json',
    apikey: '0000000000',
    'Client-Agent': 'GokuBotMD:2.5.6:Juan1986'
  }

  const submitRes = await fetchWithTimeout(
    'https://aihorde.net/api/v2/generate/async',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        prompt: `${enPrompt}, high quality, detailed`,
        params: { width: 512, height: 512, steps: 20, n: 1 },
        nsfw: false,
        censor_nsfw: true
      })
    },
    12000
  )
  if (!submitRes.ok) throw new Error(`AI Horde submit HTTP ${submitRes.status}`)
  const submitJson = await submitRes.json()
  const jobId = submitJson?.id
  if (!jobId) throw new Error('AI Horde no devolvió ID de trabajo')

  const deadline = Date.now() + 50000
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000))
    const statusRes = await fetchWithTimeout(
      `https://aihorde.net/api/v2/generate/status/${jobId}`,
      { headers },
      10000
    )
    if (!statusRes.ok) continue
    const statusJson = await statusRes.json()
    if (statusJson?.faulted) throw new Error('AI Horde falló generando la imagen')
    if (statusJson?.done && Array.isArray(statusJson.generations) && statusJson.generations[0]?.img) {
      const imgUrl = statusJson.generations[0].img
      let buf
      if (imgUrl.startsWith('http')) {
        const imgRes = await fetchWithTimeout(imgUrl, {}, 15000)
        if (!imgRes.ok) throw new Error(`AI Horde descarga HTTP ${imgRes.status}`)
        buf = Buffer.from(await imgRes.arrayBuffer())
      } else {
        buf = Buffer.from(imgUrl, 'base64')
      }

      let mime = detectImageFormat(buf)
      if (!mime || buf.length < 2000) throw new Error('AI Horde devolvió imagen inválida')

      if (mime === 'image/webp') {
        try {
          buf = await convertBufferWithFfmpeg(buf, 'webp', 'jpg')
          mime = 'image/jpeg'
        } catch {
          // ffmpeg not available; return webp buffer as-is
        }
      }
      return { buffer: buf, mime, provider: 'aihorde' }
    }
  }

  throw new Error('Tiempo de espera agotado en AI Horde')
}

export async function generateImage(prompt) {
  const cleanPrompt = String(prompt || '').trim()
  if (!cleanPrompt) throw new Error('Proporciona una descripción para generar la imagen.')

  const errors = []
  for (const fn of [() => generateImagePollinations(cleanPrompt), () => generateImageAiHorde(cleanPrompt)]) {
    try {
      return await fn()
    } catch (err) {
      errors.push(err?.message || String(err))
    }
  }

  throw new Error(`No se pudo generar la imagen. Intenta de nuevo en unos segundos. (${errors[0] || ''})`)
}

export const VOXBOX_VOICES = {
  gura: { voice_id: '67ae0979-5d4b-11ee-a861-00163e2ac61b', voice_name: 'Nahida' },
  onix: { voice_id: '67ae0f40-5d4b-11ee-a861-00163e2ac61b', voice_name: 'Optimus Prime' },
  toru: { voice_id: '67ada61f-5d4b-11ee-a861-00163e2ac61b', voice_name: 'Elon Musk' },
  ax: { voice_id: 'c82964b9-d093-11ee-bfb7-e86f38d7ec1a', voice_name: 'Eminem' }
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  'Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36'
]

function splitTtsChunks(text, maxLen = 180) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return [clean]
  const chunks = []
  let rest = clean
  while (rest.length > maxLen) {
    let idx = rest.lastIndexOf('. ', maxLen)
    if (idx < 40) idx = rest.lastIndexOf(', ', maxLen)
    if (idx < 40) idx = rest.lastIndexOf(' ', maxLen)
    if (idx < 20) idx = maxLen
    chunks.push(rest.slice(0, idx + 1).trim())
    rest = rest.slice(idx + 1).trim()
  }
  if (rest) chunks.push(rest)
  return chunks.filter(Boolean)
}

export async function generateGoogleTTS(text, lang = 'es') {
  const chunks = splitTtsChunks(text, 180)
  const buffers = []
  for (const chunk of chunks.slice(0, 6)) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=${encodeURIComponent(lang)}&client=tw-ob`
    const res = await fetchWithTimeout(
      url,
      { headers: { 'User-Agent': USER_AGENTS[0] } },
      12000
    )
    if (!res.ok) throw new Error(`Google TTS HTTP ${res.status}`)
    buffers.push(Buffer.from(await res.arrayBuffer()))
  }
  const merged = Buffer.concat(buffers)
  if (merged.length < 500) throw new Error('Google TTS devolvió audio vacío')
  return { buffer: merged, mimetype: 'audio/mpeg', voiceName: `Google (${lang})`, provider: 'google-tts' }
}

export async function generateVoiceTTS(text, modelKey = 'es') {
  const cleanText = String(text || '').trim()
  if (!cleanText) throw new Error('Proporciona un texto para convertir a voz.')

  const key = String(modelKey || 'es').trim().toLowerCase()
  const voice = VOXBOX_VOICES[key]

  if (voice) {
    try {
      const randomIp = Array.from({ length: 4 }, () => Math.floor(Math.random() * 256)).join('.')
      const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
      const res = await fetchWithTimeout(
        'https://voxbox-tts-api.imyfone.com/pc/v1/voice/tts',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
            'X-Forwarded-For': randomIp,
            'User-Agent': ua
          },
          body: JSON.stringify({
            raw_text: cleanText,
            url: 'https://filme.imyfone.com/text-to-speech/anime-text-to-speech/',
            product_id: '200054',
            convert_data: [{
              voice_id: voice.voice_id,
              speed: '1',
              volume: '50',
              text: cleanText,
              pos: 0
            }]
          })
        },
        16000
      )
      if (!res.ok) throw new Error(`Voxbox HTTP ${res.status}`)
      const data = await res.json()
      const audioUrl = data?.data?.convert_result?.[0]?.oss_url
      if (!audioUrl) throw new Error('Voxbox no devolvió URL de audio')
      const audioRes = await fetchWithTimeout(audioUrl, {}, 16000)
      if (!audioRes.ok) throw new Error(`Audio descarga HTTP ${audioRes.status}`)
      let buf = Buffer.from(await audioRes.arrayBuffer())
      let mimetype = 'audio/mpeg'
      try {
        buf = await convertBufferWithFfmpeg(buf, 'wav', 'mp3', ['-vn', '-acodec', 'libmp3lame', '-b:a', '128k'])
        return { buffer: buf, mimetype, voiceName: voice.voice_name, provider: 'voxbox' }
      } catch {
        // Sin ffmpeg en el servidor, usar Google TTS MP3 nativo compatible con WhatsApp
        throw new Error('ffmpeg no disponible para convertir audio wav a mp3')
      }
    } catch {
      // Fall through cleanly to Google TTS fallback
    }
  }

  const lang = key === 'en' || key === 'ingles' || key === 'inglés' ? 'en' : 'es'
  return await generateGoogleTTS(cleanText, lang)
}
