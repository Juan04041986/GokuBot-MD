import fetch from "node-fetch"
import yts from 'yt-search'

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!global.db.data.chats[m.chat]?.fDescargas && m.isGroup) {
return conn.sendMessage(m.chat, { text: `*« 🐲 »*  Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
}

if (!text) {
return conn.sendMessage(m.chat, { text: `🐲 *Ejemplo:*\n*${usedPrefix + command}* Ozuna Una Aventura` }, { quoted: m })
}

try {
await m.react('⏰')
let videoData
let videoUrl = text

if (/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be/.test(text)) {
const videoId = text.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/)?.[1]
if (videoId) videoUrl = `https://www.youtube.com/watch?v=${videoId}`
const searchResult = await yts({ videoId })
videoData = searchResult.videos?.[0] || searchResult
} else {
const search = await yts(text)
if (!search.videos || search.videos.length === 0) {
return conn.sendMessage(m.chat, { text: `❌ No se encontró nada para: ${text}` }, { quoted: m })
}
videoData = search.videos[0]
videoUrl = videoData.url
}

await conn.sendMessage(m.chat, { text: `🐲 *Descargando audio...*\n> ${videoData?.title || 'Audio'}\n❒ *Autor:* ${videoData?.author?.name || 'Desconocido'}\n❒ *Duración:* ${videoData?.timestamp || '?'}` }, { quoted: m })

// API GOHAN - AUDIO
const apiUrl = `https://api-gohan-v1.onrender.com/download/ytaudio?url=${encodeURIComponent(videoUrl)}`
const res = await fetch(apiUrl)
const data = await res.json()
console.log('Respuesta Gohan:', JSON.stringify(data)?.slice(0, 800))

// El link viene en result.download_url
let dl_url = data?.result?.download_url || data?.result?.url || data?.download_url || data?.url || data?.data?.download

if (!dl_url) {
return conn.sendMessage(m.chat, { text: `❌ La API de Gohan no devolvió el audio, intenta de nuevo.` }, { quoted: m })
}

let title = data?.result?.title || videoData?.title || 'audio'
let cleanTitle = title.replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, '_')
let fileName = `${cleanTitle}.mp3`

// Descargamos el buffer para que WhatsApp lo reproduzca si o si
let buffer
try {
  const audioRes = await fetch(dl_url)
  buffer = Buffer.from(await audioRes.arrayBuffer())
} catch {
  buffer = null
}

if (buffer) {
  await conn.sendMessage(m.chat, { audio: buffer, mimetype: 'audio/mpeg', fileName: fileName }, { quoted: m })
} else {
  await conn.sendMessage(m.chat, { audio: { url: dl_url }, mimetype: 'audio/mpeg', fileName: fileName }, { quoted: m })
}

await m.react('✅')

} catch (error) {
console.error('Error en play:', error)
await conn.sendMessage(m.chat, { text: `❌ Error: ${error.message}` }, { quoted: m })
}
}

handler.command = ['play', 'play2', 'ytplay']
handler.tags = ["descargas"]
export default handler
