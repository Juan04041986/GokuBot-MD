import axios from 'axios'
import yts from 'yt-search'

const MAX_BYTES = 400 * 1024 * 1024
const MIN_BYTES = 20 * 1024
const DOC_BYTES = 16 * 1024 * 1024
const TIMEOUT_DESCARGA = 120000

const limpiarNombre = (t) => (String(t || 'audio')).replace(/[\\/:*?\"<>|]/g, '').trim().slice(0, 80) || 'audio'

const extraerLink = (d) => {
    const c = d?.result?.download_url || d?.resultado?.download_url || d?.data?.download || d?.data?.dl ||
        d?.result?.download || d?.download || d?.url || ''
    return typeof c === 'string' && c.startsWith('http') ? c : ''
}

const descargar = async (url) => {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: TIMEOUT_DESCARGA,
        maxContentLength: MAX_BYTES,
        maxBodyLength: MAX_BYTES,
        headers: { 'User-Agent': 'Mozilla/5.0' }
    })
    const buf = Buffer.from(res.data)
    if (buf.length < MIN_BYTES) throw new Error('archivo muy pequeño')
    const tipo = String(res.headers['content-type'] || '')
    if (tipo.includes('text/html') || tipo.includes('application/json')) throw new Error('no es audio')
    return buf
}

const pedirAudio = async (api) => {
    const { data } = await axios.get(api, { timeout: 15000, headers: { 'User-Agent': 'Mozilla/5.0' } })
    const link = extraerLink(data)
    if (!link) throw new Error('sin enlace')
    return descargar(link)
}

const pedirDorratz = async (videoUrl) => {
    const api = `https://api.dorratz.com/v1/youtube?url=${encodeURIComponent(videoUrl)}&type=audio&quality=128`
    const { data } = await axios.get(api, { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (!data?.ok || !data?.data) throw new Error('dorratz sin resultado')
    const candidatos = [
        data.data.proxy ? `https://api.dorratz.com${data.data.proxy}` : '',
        typeof data.data.download === 'string' ? data.data.download : ''
    ].filter((l) => l.startsWith('http'))
    let ultimo = new Error('dorratz sin enlaces')
    for (const l of candidatos) {
        try { return await descargar(l) } catch (e) { ultimo = e }
    }
    throw ultimo
}

const getAudio = async (videoUrl) => {
    const enc = encodeURIComponent(videoUrl)
    const apis = [
        `https://api-gohan-v1.onrender.com/download/ytaudio?url=${enc}&download=true`,
        `https://api-gohan-v1.onrender.com/download/ytaudio?url=${enc}`,
        `https://api.delirius.online/download/ytmp3?url=${enc}`,
        `https://api.ryuzei.xyz/download/ytmp3/v4?url=${enc}&quality=64`,
        `https://api.starlights.uk/api/download/ytmp3?url=${enc}`
    ]
    let ultimo = null
    for (let intento = 1; intento <= 2; intento++) {
        const tareas = [...apis.map(pedirAudio), pedirDorratz(videoUrl)]
        try {
            return await Promise.any(tareas)
        } catch (err) {
            ultimo = err
        }
    }
    const primerError = ultimo?.errors?.[0]?.message
    throw new Error(`todas las APIs fallaron${primerError ? ': ' + primerError : ''}`)
}

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!global.db.data.chats[m.chat]?.fDescargas && m.isGroup) {
return conn.sendMessage(m.chat, { text: `*« 🐲 »*  Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
}

const query = text?.trim()
if (!query) return conn.sendMessage(m.chat, { text: `ꕤ Ingresa nombre o link\n*${usedPrefix + command}* Ozuna Una Aventura` }, { quoted: m })

try {
await m.react('🎧')

let video
if (/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be/.test(query)) {
  const videoId = query.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/)?.[1]
  const search = await yts({ videoId })
  video = search.videos?.[0] || search
} else {
  const search = await yts(query)
  video = search.videos?.[0]
}

if (!video) {
  await m.react('❌')
  return conn.sendMessage(m.chat, { text: `❌ No encontré resultados para *${query}*` }, { quoted: m })
}
if (!video.seconds) {
  await m.react('❌')
  return conn.sendMessage(m.chat, { text: `❌ *${video.title}* es un directo (en vivo) y no se puede descargar. Busca otra versión.` }, { quoted: m })
}

const videoUrl = `https://youtu.be/${video.videoId}`
const titulo = limpiarNombre(video.title)

const audio = await getAudio(videoUrl)
const mb = (audio.length / (1024 * 1024)).toFixed(2)

// MINIATURA ESTILO GOKU - igual que el play
let thumb = null
try {
let img = await axios.get(video.thumbnail, { responseType: 'arraybuffer' })
thumb = Buffer.from(img.data)
} catch {}

await conn.sendMessage(m.chat, {
  image: { url: video.thumbnail },
  caption: `*「✦」 ¡Descargando!*\n\n> ❀ Título » *${video.title}*\n\n> ✐ Canal » *${video.author?.name || 'Desconocido'}*\n> ⴵ Duración » *${video.timestamp || '?'}*\n> ❒ Tamaño » *${mb}MB*\n> 🜸 Link » _${videoUrl}_`
}, { quoted: m }).catch(() => null)

if (audio.length > DOC_BYTES) {
  await conn.sendMessage(m.chat, { document: audio, mimetype: 'audio/mpeg', fileName: `${titulo}.mp3` }, { quoted: m })
} else {
  await conn.sendMessage(m.chat, {
    audio: audio,
    mimetype: 'audio/mpeg',
    fileName: `${titulo}.mp3`,
    ptt: false,
    contextInfo: {
      externalAdReply: {
        title: video.title,
        body: `Canal: ${video.author?.name || 'Desconocido'} | 🐲 GokuBot`,
        thumbnail: thumb,
        mediaType: 2,
        mediaUrl: videoUrl,
        sourceUrl: videoUrl,
        renderLargerThumbnail: true
      }
    }
  }, { quoted: m })
}

await m.react('✅')

} catch (e) {
console.log('[YTMP3 ERROR]', e?.message)
await m.react('❌')
await conn.sendMessage(m.chat, { text: `❌ Error al descargar, intenta de nuevo` }, { quoted: m })
}
}

handler.command = ['audio', 'ytmp3']
handler.tags = ["descargas"]
export default handler
