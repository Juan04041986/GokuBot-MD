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
if (!search.videos.length) return conn.sendMessage(m.chat, { text: 'No se encontró el video.' }, { quoted: m })
url = search.videos[0].url
}

try {
let api = await fetch(`https://api.delirius.online/download/ytmp4?url=${encodeURIComponent(url)}&format=360p`)
let json = await api.json()
let data = json.data

if (!data?.download) throw new Error('Sin link')

await conn.sendMessage(m.chat, {
video: { url: data.download },
mimetype: 'video/mp4',
fileName: `${data.title}.mp4`,
caption: `*${data.title}*\n*Autor:* ${data.author}`
}, { quoted: m })

} catch (e) {
await conn.sendMessage(m.chat, { text: 'Error al descargar el video. Intenta con otro.' }, { quoted: m })
}
}

handler.command = ['video', 'ytmp4']
export default handler
