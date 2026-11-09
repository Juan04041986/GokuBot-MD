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
let api = await fetch(`https://api.delirius.online/download/ytmp3?url=${encodeURIComponent(url)}`)
let json = await api.json()
let data = json.data

if (!data?.download) throw new Error('Sin link')

await conn.sendMessage(m.chat, {
audio: { url: data.download },
mimetype: 'audio/mpeg',
fileName: `${data.title}.mp3`
}, { quoted: m })

} catch (e) {
await conn.sendMessage(m.chat, { text: 'Error al descargar el audio. Intenta con otro.' }, { quoted: m })
}
}

handler.command = ['audio', 'ytmp3']
export default handler
