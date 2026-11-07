import fetch from "node-fetch"
import yts from 'yt-search'

let handler = async (m, { conn, text, usedPrefix, command }) => {
if (!global.db.data.chats[m.chat]?.fDescargas && m.isGroup) {
return conn.sendMessage(m.chat, { text: `*« 🐲 »*  Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
}

if (!text) {
return conn.sendMessage(m.chat, { text: `🐲 *Ejemplo:*\n*${usedPrefix + command}* Yan Block 444` }, { quoted: m })
}

try {
await m.react('⏰')
let videoData
let videoUrl = text

// Si es link de YouTube, sacamos el ID
if (/^(?:https?:\/\/)?(?:www\.|m\.|music\.)?youtu\.?be/.test(text)) {
const videoId = text.match(/(?:youtu\.be\/|youtube\.com(?:\/embed\/|\/v\/|\/watch\?v=|\/watch\?.+&v=))([^&\n?#]+)/)?.[1]
if (videoId) videoUrl = `https://www.youtube.com/watch?v=${videoId}`
const searchResult = await yts({ videoId })
videoData = searchResult.videos?.[0] || searchResult
} else {
// Si es nombre, buscamos
const search = await yts(text)
if (!search.videos || search.videos.length === 0) {
return conn.sendMessage(m.chat, { text: `❌ No se encontró nada para: ${text}` }, { quoted: m })
}
videoData = search.videos[0]
videoUrl = videoData.url
}

// Avisamos que ya lo encontró
await conn.sendMessage(m.chat, { text: `🐲 *Descargando audio...*\n> ${videoData?.title || 'Audio'}\n❒ *Autor:* ${videoData?.author?.name || 'Desconocido'}\n❒ *Duración:* ${videoData?.timestamp || '?'}` }, { quoted: m })

// API DELIRIUS AUDIO DIRECTO
const apiUrl = `https://api.delirius.online/download/ytmp3?url=${encodeURIComponent(videoUrl)}`
const res = await fetch(apiUrl)
const data = await res.json()
console.log('Respuesta Delirius:', JSON.stringify(data)?.slice(0, 800))

// El link viene en data.download
let dl_url = data?.data?.download || data?.download || data?.data?.url || data?.url || data?.result?.download

if (!dl_url || typeof dl_url !== 'string') {
return conn.sendMessage(m.chat, { text: `❌ La API no devolvió el audio, intenta con otro tema.` }, { quoted: m })
}

let title = data?.data?.title || videoData?.title || 'audio'
let cleanTitle = title.replace(/[^\w\s]/gi, '').trim().replace(/\s+/g, '_')
let fileName = `${cleanTitle}.mp3`

await conn.sendMessage(m.chat, { audio: { url: dl_url }, mimetype: 'audio/mpeg', fileName: fileName }, { quoted: m })
await m.react('✅')

} catch (error) {
console.error('Error en play:', error)
await conn.sendMessage(m.chat, { text: `❌ Error: ${error.message}` }, { quoted: m })
}
}

handler.command = ['play', 'play2', 'ytplay']
handler.tags = ["descargas"]
export default handler
