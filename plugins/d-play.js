import fetch from "node-fetch"
import yts from 'yt-search'

const CACHE_TIME = 2 * 60 * 1000 // 2 minutos
let playCache = {}

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!global.db.data.chats[m.chat]?.fDescargas && m.isGroup) {
return conn.sendMessage(m.chat, { text: `*« 🐲 »*  Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
}

if (!text) {
return conn.sendMessage(m.chat, { text: `${mess.example}\n*${usedPrefix + command}* Golden Brown\n\nO puede proporcionar un enlace.` }, { quoted: m })
}

try {
await m.react('⏰')
let videoData;

if (/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be/.test(text)) {
const videoId = text.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/)?.[1]
if (!videoId) return conn.sendMessage(m.chat, { text: mess.unlink }, { quoted: m })
const searchResult = await yts({ videoId })
videoData = searchResult.videos?.[0] || searchResult
if (!videoData?.url) videoData.url = `https://youtu.be/${videoId}`
} else {
const search = await yts(text)
if (!search.videos || search.videos.length === 0) {
return conn.sendMessage(m.chat, { text: mess.nosear }, { quoted: m })
}
videoData = search.videos[0]
}

let caption = `> ${videoData.title}
❒ *Autor* » ${videoData.author?.name || 'Desconocido'}
❒ *Duracion* » ${videoData.timestamp}
❒ *Vistas* » ${videoData.views?.toLocaleString() || '0'}
❒ *Publicado* » ${videoData.ago}
❒ *Enlace* » ${videoData.url}

🐲 Responda con los siguientes formatos:
\`Video\` o \`Videodoc\`
\`Audio\` o \`Audiodoc\`

> ${textbot}`

let mensajeEnviado = await conn.sendMessage(m.chat, { text: caption, contextInfo: { forwardingScore: 1, isForwarded: false, externalAdReply: { showAdAttribution: false, renderLargerThumbnail: true, title: "⫶☰ YouTube : Play", body: botname, containsAutoReply: true, mediaType: 1, thumbnailUrl: videoData.thumbnail, sourceUrl: null }}}, { quoted: m })

const messageId = mensajeEnviado.key.id
playCache[messageId] = { videoData, timestamp: Date.now(), chat: m.chat, activo: true, expirado: false }

setTimeout(() => {
if (playCache[messageId] && playCache[messageId].activo && !playCache[messageId].expirado) {
playCache[messageId].expirado = true
playCache[messageId].activo = false
setTimeout(() => { delete playCache[messageId] }, 10000)
}
}, CACHE_TIME)

} catch (error) {
console.error('Error en play:', error)
await conn.sendMessage(m.chat, { text: `${error.message}` }, { quoted: m })
}
}

handler.before = async (m, { conn }) => {
if (!m.text) return false
if (m.isBaileys) return false
if (!m.quoted) return false

const quotedId = m.quoted.key?.id || m.quoted.id
if (!quotedId) return false
const isFromMe = m.quoted.fromMe ?? m.quoted.key?.fromMe
if (!isFromMe) return false

const searchCache = playCache[quotedId]
if (!searchCache) return false
if (searchCache.expirado || !searchCache.activo) return true

const input = m.text.trim().toLowerCase()
let formato = null
let asDoc = false

if (input === '1' || input === 'audio') { formato = 'audio'; asDoc = false }
else if (input === '2' || input === 'video') { formato = 'video'; asDoc = false }
else if (input === '3' || input === 'audio-doc' || input === 'audiodoc') { formato = 'audio'; asDoc = true }
else if (input === '4' || input === 'video-doc' || input === 'videodoc') { formato = 'video'; asDoc = true }
else return false

const videoData = searchCache.videoData

try {
await m.react('⏰')

let apiURL, mimeType, fileExt
if (formato === 'audio') {
  // API DELIRIUS AUDIO
  apiURL = `https://api.delirius.online/download/ytmp3?url=${encodeURIComponent(videoData.url)}`
  mimeType = 'audio/mpeg'
  fileExt = 'mp3'
} else {
  // API DELIRIUS VIDEO
  apiURL = `https://api.delirius.online/download/ytmp4?url=${encodeURIComponent(videoData.url)}`
  mimeType = 'video/mp4'
  fileExt = 'mp4'
}

let data = await tryAPI(apiURL)
console.log('Respuesta Delirius:', JSON.stringify(data)?.slice(0, 1000))

// Delirius puede devolver el link en varios lugares, los revisamos todos
let dl_url = data?.download?.url
  || data?.download?.dl_url
  || data?.download
  || data?.result?.download?.url
  || data?.result?.dl_url
  || data?.result?.url
  || data?.data?.download?.url
  || data?.data?.url
  || data?.url
  || data?.link

// Si download es string directo
if (typeof dl_url !== 'string' && typeof data?.download === 'string') dl_url = data.download
// Si viene en list como en FB
if (!dl_url && Array.isArray(data?.list) && data.list[0]?.url) dl_url = data.list[0].url
// Si viene en downloads array
if (!dl_url && Array.isArray(data?.downloads) && data.downloads[0]?.url) dl_url = data.downloads[0].url

if (!dl_url) {
  return conn.sendMessage(m.chat, { text: `❌ La API de Delirius no devolvió link.\nIntenta de nuevo con otro video.` }, { quoted: m })
}

const title = data?.title || data?.result?.title || videoData.title || 'audio'
const cleanTitle = title.replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, '_')
const fileName = `${cleanTitle}.${fileExt}`

let fileSizeMB = 0
try {
  let head = await fetch(dl_url, { method: "HEAD" })
  let fileSize = head.headers.get("content-length") || 0
  fileSizeMB = parseFloat((fileSize / (1024 * 1024)).toFixed(2))
} catch {}

if (asDoc) {
  await conn.sendMessage(m.chat, { document: { url: dl_url }, mimetype: mimeType, fileName: fileName, caption: `🐲 Enviado como documento` }, { quoted: m })
} else {
  if (formato === 'audio') {
    if (fileSizeMB >= 15) {
      await conn.sendMessage(m.chat, { document: { url: dl_url }, mimetype: mimeType, fileName: fileName, caption: `🐲 Enviado como documento por exceder *15MB*` }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, { audio: { url: dl_url }, mimetype: mimeType, fileName: fileName }, { quoted: m })
    }
  } else {
    if (fileSizeMB >= 20) {
      await conn.sendMessage(m.chat, { document: { url: dl_url }, mimetype: mimeType, fileName: fileName, caption: `🐲 Enviado como documento por exceder *20MB*` }, { quoted: m })
    } else {
      await conn.sendMessage(m.chat, { video: { url: dl_url }, mimetype: mimeType, fileName: fileName }, { quoted: m })
    }
  }
}

await m.react('✅')
delete playCache[quotedId]

} catch (error) {
console.error('Error al descargar:', error)
await conn.sendMessage(m.chat, { text: `❌ Error: ${error.message}` }, { quoted: m })
}
return true
}

handler.command = ['play', 'play2', 'ytplay']
handler.tags = ["descargas"]
export default handler

async function tryAPI(url) {
try {
const res = await fetch(url)
const data = await res.json()
return data
} catch (e) {
console.log('Error tryAPI:', e.message)
return null
}
  }
