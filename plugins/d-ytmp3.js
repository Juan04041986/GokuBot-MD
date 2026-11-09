import fetch from 'node-fetch'
import yts from 'yt-search'

let handler = async (m, { conn, usedPrefix, command, text }) => {
if (!global.db.data.chats[m.chat].fDescargas && m.isGroup) {
return conn.sendMessage(m.chat, { text: `📍 Los comandos de *[ descargas ]* estan desactivados...` }, { quoted: m })
}

if (!text) return conn.sendMessage(m.chat, { text: `Ejemplo: *${usedPrefix + command}* Yan Block - 444` }, { quoted: m })

await conn.sendMessage(m.chat, { react: { text: '⏳', key: m.key } })

let url = text
if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
let search = await yts(text)
if (!search.videos.length) return conn.sendMessage(m.chat, { text: 'No se encontró el audio.' }, { quoted: m })
url = search.videos[0].url
}

try {
// USAMOS YTMP4 PORQUE YTMP3 DA LINK DE SAVETUBE CORRUPTO DE 52KB
let api = await fetch(`https://api.delirius.online/download/ytmp4?url=${encodeURIComponent(url)}&format=360p`)
let json = await api.json()
let data = json.data
if (!data?.download) throw new Error('Sin link')

let res = await fetch(data.download, {
headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36' }
})
let buffer = Buffer.from(await res.arrayBuffer())
console.log('PESO:', buffer.length)

if (buffer.length < 500000) throw new Error('Archivo muy pequeño')

// SOLO ESTO AGREGUE: MINIATURA
let thumb = null
try {
let img = await fetch(data.image)
thumb = Buffer.from(await img.arrayBuffer())
} catch {}

await conn.sendMessage(m.chat, {
audio: buffer,
mimetype: 'audio/mpeg',
fileName: `${data.title}.mp3`,
ptt: false,
contextInfo: {
externalAdReply: {
title: data.title,
body: `Autor: ${data.author} | GokuBot`,
thumbnail: thumb,
mediaType: 2,
mediaUrl: url,
sourceUrl: url,
renderLargerThumbnail: true
}
}
}, { quoted: m })

} catch (e) {
console.log(e)
await conn.sendMessage(m.chat, { text: 'Error al descargar el audio. Intenta de nuevo.' }, { quoted: m })
}
}

handler.command = ['audio', 'ytmp3']
export default handler
