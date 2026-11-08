import fetch from 'node-fetch'
import moment from 'moment-timezone'

let handler = async (m, { conn, usedPrefix }) => {
  const name = await conn.getName(m.sender).catch(() => 'Usuario')
  const uptime = clockString(process.uptime() * 1000)
  const hora = moment.tz('America/Lima').format('HH:mm:ss')
  const fecha = moment.tz('America/Lima').format('DD/MM/YYYY')
  const totalUsers = Object.keys(global.db?.data?.users || {}).length
  const totalPlugins = Object.keys(global.plugins || {}).length

  const menu = `
╭───〔 *🐉 GOKU BOT* 〕───╮
│
│ 👤 *Usuario:* @${m.sender.split('@')[0]}
│ 📅 *Fecha:* ${fecha}
│ 🕒 *Hora:* ${hora}
│ ⏱️ *Uptime:* ${uptime}
│ 👥 *Usuarios:* ${totalUsers}
│ ⚡ *Comandos:* ${totalPlugins}
│ 📌 *Prefijo:* ${usedPrefix}
│
╰──────────────────╯

${String.fromCharCode(8206).repeat(4001)}

*╭─「 INFO 」*
│ ➤ ${usedPrefix}ping
│ ➤ ${usedPrefix}estado
│ ➤ ${usedPrefix}grupos
│ ➤ ${usedPrefix}canal
│ ➤ ${usedPrefix}support
*╰────────────*

*╭─「 DRAGON BALL 」*
│ ➤ ${usedPrefix}biografiagoku
│ ➤ ${usedPrefix}biografiavegeta
│ ➤ ${usedPrefix}biografiagohan
│ ➤ ${usedPrefix}biografiafreezer
│ ➤ ${usedPrefix}biografiacelula
│ ➤ ${usedPrefix}noticiasdragonball
│ ➤ ${usedPrefix}curiosidadesdragonball
*╰────────────*

*╭─「 DESCARGAS 」*
│ ➤ ${usedPrefix}play <texto>
│ ➤ ${usedPrefix}ytmp3 <link>
│ ➤ ${usedPrefix}ytmp4 <link>
│ ➤ ${usedPrefix}tiktok <link>
│ ➤ ${usedPrefix}instagram <link>
│ ➤ ${usedPrefix}facebook <link>
│ ➤ ${usedPrefix}spotify <link>
│ ➤ ${usedPrefix}github <link>
│ ➤ ${usedPrefix}mediafire <link>
*╰────────────*

*╭─「 BUSQUEDAS 」*
│ ➤ ${usedPrefix}google <texto>
│ ➤ ${usedPrefix}imagen <texto>
│ ➤ ${usedPrefix}yts <texto>
│ ➤ ${usedPrefix}apk <texto>
*╰────────────*

*╭─「 GRUPOS 」*
│ ➤ ${usedPrefix}link
│ ➤ ${usedPrefix}invocar <texto>
│ ➤ ${usedPrefix}kick @user
│ ➤ ${usedPrefix}add <numero>
*╰────────────*

*╭─「 CONVERTIDOR 」*
│ ➤ ${usedPrefix}sticker
│ ➤ ${usedPrefix}togif
│ ➤ ${usedPrefix}jpg
│ ➤ ${usedPrefix}turl
*╰────────────*

*╭─「 IA 」*
│ ➤ ${usedPrefix}chatgpt <texto>
│ ➤ ${usedPrefix}imagina <texto>
*╰────────────*

*╭─「 RPG 」*
│ ➤ ${usedPrefix}minar
│ ➤ ${usedPrefix}talar
│ ➤ ${usedPrefix}cazar
│ ➤ ${usedPrefix}work
│ ➤ ${usedPrefix}coins
│ ➤ ${usedPrefix}nivel
*╰────────────*

*╭─「 OWNER 」*
│ ➤ ${usedPrefix}fix
│ ➤ ${usedPrefix}err
*╰────────────*

> *Goku Bot - Hecho para ti 🐉*
`.trim()

  // --- INTENTA CON IMAGEN, SI FALLA MANDA SOLO TEXTO ---
  try {
    const res = await fetch('https://i.imgur.com/9dG5y9J.jpg')
    const img = Buffer.from(await res.arrayBuffer())

    await conn.sendMessage(m.chat, {
      image: img,
      caption: menu,
      mentions: [m.sender]
    }, { quoted: m })

  } catch (e) {
    console.log('Sin imagen, mando texto:', e.message)
    // ESTE NUNCA FALLA, ES SOLO TEXTO
    await conn.sendMessage(m.chat, {
      text: menu,
      mentions: [m.sender]
    }, { quoted: m })
  }
}

handler.help = ['menu']
handler.tags = ['main']
handler.command = ['menu', 'help', 'menú', 'menus']
export default handler

function clockString(ms) {
  let h = Math.floor(ms / 3600000)
  let m = Math.floor(ms / 60000) % 60
  let s = Math.floor(ms / 1000) % 60
  return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
}
