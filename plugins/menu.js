import fetch from 'node-fetch'
import { displayName, BRAND } from '../lib/economia.js'

const isImage = buf => {
  if (!buf || buf.length < 800) return false
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff
  const png = buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  const webp = buf.slice(8, 12).toString() === 'WEBP'
  return jpg || png || webp
}

async function getCover() {
  const candidatos = [
    global.menuImg,
    global.gokuMenu,
    global.gokuImg,
    'https://files.catbox.moe/3rhs2g.jpg'
  ].filter(Boolean)

  for (const url of candidatos) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, redirect: 'follow' })
      if (!res.ok) continue
      const buf = Buffer.from(await res.arrayBuffer())
      if (!isImage(buf)) continue
      return buf
    } catch {}
  }
  return null
}

const fecha = () => {
  try {
    return new Date().toLocaleString('es-PE', {
      timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  } catch { return '' }
}

let handler = async (m, { conn, usedPrefix }) => {
  const nombre = displayName(m, conn)
  const p = usedPrefix
  const hora = fecha()

  const portada = `
╭───〔 *🐉 GOKU BOT* 〕───╮
│ 👤 Usuario: ${nombre}
│ 📌 Prefijo: ${p}
│ 🕒 ${hora}
╰──────────────────╯

> ⚡ ${BRAND} ⚡`.trim()

  const menu = `
*╭─「 INFO 」*
│ ➤ ${p}ping
│ ➤ ${p}estado
│ ➤ ${p}grupos
│ ➤ ${p}canal
│ ➤ ${p}restart
*╰────────────*

*╭─「 DRAGON BALL 」*
│ ➤ ${p}biografiagoku
│ ➤ ${p}biografiavegeta
│ ➤ ${p}biografiagohan
│ ➤ ${p}biografiafreezer
│ ➤ ${p}noticiasdragonball
*╰────────────*

*╭─「 DESCARGAS 」*
│ ➤ ${p}play <texto>
│ ➤ ${p}ytmp3 <link>
│ ➤ ${p}ytmp4 <link>
│ ➤ ${p}tiktok <link>
│ ➤ ${p}instagram <link>
│ ➤ ${p}facebook <link>
│ ➤ ${p}spotify <link>
*╰────────────*

*╭─「 BUSQUEDAS 」*
│ ➤ ${p}google <texto>
│ ➤ ${p}imagen <texto>
│ ➤ ${p}yts <texto>
*╰────────────*

*╭─「 GRUPOS 」*
│ ➤ ${p}link
│ ➤ ${p}invocar <texto>
│ ➤ ${p}kick @user
│ ➤ ${p}add <numero>
*╰────────────*

*╭─「 IA & CHATBOT 」*
│ ➤ ${p}chatgpt <texto>
│ ➤ ${p}ia <texto>
│ ➤ ${p}claude <texto>
│ ➤ ${p}dolphin <texto>
│ ➤ ${p}imagina <texto>
│ ➤ ${p}voz <texto>=<voz>
│ ➤ ${p}bot <texto>
│ ➤ ${p}chatbot on/off
*╰────────────*

*╭─「 ECONOMÍA 」*
│ ➤ ${p}eco
│ ➤ ${p}coins
│ ➤ ${p}diario
│ ➤ ${p}trabajar
│ ➤ ${p}minar
│ ➤ ${p}talar
│ ➤ ${p}pescar
│ ➤ ${p}cazar
│ ➤ ${p}slut
│ ➤ ${p}crimen
│ ➤ ${p}robar @user
│ ➤ ${p}cofre
│ ➤ ${p}slot <apuesta>
│ ➤ ${p}apostar <cant> <op>
│ ➤ ${p}banco
│ ➤ ${p}pagar <cant> @user
│ ➤ ${p}topcoins
│ ➤ ${p}tienda
*╰────────────*

> *Goku Bot 🐉*

> ⚡ ${BRAND} ⚡`.trim()

  const cover = await getCover()

  if (cover)
    await conn.sendMessage(m.chat, {
      image: cover,
      mimetype: cover[0] === 0xff ? 'image/jpeg' : cover[0] === 0x89 ? 'image/png' : 'image/webp',
      caption: portada
    }, { quoted: m }).catch(() => {})

  await conn.sendMessage(m.chat, { text: cover ? menu : `${portada}\n\n${menu}` }, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'menú', 'menus']

export default handler
