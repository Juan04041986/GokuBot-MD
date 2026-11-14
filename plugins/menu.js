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

// WhatsApp corta los captions de imagen en ~1024 caracteres
const LIMITE_CAPTION = 1024

let handler = async (m, { conn, usedPrefix }) => {
  const nombre = displayName(m, conn).slice(0, 24)
  const p = usedPrefix
  const hora = fecha()

  const cabecera = `╭───〔 *🐉 GOKU BOT* 〕───╮
│ 👤 Usuario: ${nombre}
│ 📌 Prefijo: ${p}
│ 🕒 ${hora}
╰──────────────────╯`.trim()

  const secciones = [
    ['INFO', ['ping', 'estado', 'grupos', 'canal', 'restart', 'autoread']],
    ['DRAGON BALL', ['biografiagoku', 'biografiavegeta', 'biografiagohan', 'noticiasdragonball']],
    ['DESCARGAS', ['play', 'ytmp3', 'ytmp4', 'tiktok', 'instagram', 'facebook', 'spotify']],
    ['BUSQUEDAS', ['google', 'imagen', 'yts']],
    ['GRUPOS', ['link', 'join', 'invocar', 'kick', 'add']],
    ['IA & CHATBOT', ['chatgpt', 'ia', 'claude', 'dolphin', 'imagina', 'voz', 'bot', 'chatbot']],
    ['ECONOMÍA', ['eco', 'coins', 'diario', 'trabajar', 'minar', 'talar', 'pescar', 'cazar', 'slut', 'crimen', 'robar', 'cofre', 'slot', 'apostar', 'banco', 'pagar', 'topcoins', 'tienda']]
  ]

  // Formato compacto: cada categoría en un solo renglón para que TODO quepa en un mensaje
  const cuerpo = secciones
    .map(([titulo, cmds]) => `\n*⚡ ${titulo}*\n${cmds.map(c => p + c).join(' • ')}`)
    .join('\n')

  const pie = `\n\n> ⚡ ${BRAND} ⚡`

  const todo = `${cabecera}\n${cuerpo}${pie}`

  const cover = await getCover()
  const mimetype = !cover ? null : cover[0] === 0xff ? 'image/jpeg' : cover[0] === 0x89 ? 'image/png' : 'image/webp'

  // 1) Todo en un solo mensaje (imagen + menú completo)
  if (cover && todo.length <= LIMITE_CAPTION)
    return conn.sendMessage(m.chat, { image: cover, mimetype, caption: todo }, { quoted: m })

  // 2) Si no hay imagen, todo en un solo texto
  if (!cover)
    return conn.sendMessage(m.chat, { text: todo }, { quoted: m })

  // 3) Respaldo: nombre muy largo o menú gigante -> portada corta + menú
  await conn.sendMessage(m.chat, { image: cover, mimetype, caption: cabecera + pie }, { quoted: m }).catch(() => {})
  return conn.sendMessage(m.chat, { text: `${cuerpo}${pie}`.trim() }, { quoted: m })
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'menú', 'menus']

export default handler
