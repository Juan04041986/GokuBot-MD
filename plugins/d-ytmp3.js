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

// Descarga con headers de navegador, si no savetube te da 52kb de basura
let res = await fetch(data.download, {
headers: {
'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
'Accept': '*/*',
'Referer': 'https://www.youtube.com/'
}
})
let buffer = Buffer.from(await res.arrayBuffer())

console.log('PESO DEL AUDIO:', buffer.length)

if (buffer.length < 200000) {
return conn.sendMessage(m.chat, { text: 'El servidor de audio me dio un archivo corrupto (52kb). Intenta de nuevo en 10 seg.' }, { quoted: m })
}

await conn.sendMessage(m.chat, {
audio: buffer,
mimetype: 'audio/mpeg',
fileName: `${data.title}.mp3`,
ptt: false
}, { quoted: m })

} catch (e) {
console.log(e)
await conn.sendMessage(m.chat, { text: 'Error al descargar el audio. Intenta con otro.' }, { quoted: m })
}
}

handler.command = ['audio', 'ytmp3']
export default handler
