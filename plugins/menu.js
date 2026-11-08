import fs from 'fs'
import moment from 'moment-timezone'

let handler = async (m, { conn, usedPrefix }) => {
  try {
    // --- DATOS SEGUROS, NADA QUE PUEDA FALLAR ---
    const name = await conn.getName(m.sender).catch(() => 'Usuario')
    const uptime = clockString(process.uptime() * 1000)
    const hora = moment.tz('America/Lima').format('HH:mm:ss')
    const fecha = moment.tz('America/Lima').format('DD/MM/YYYY')
    const totalUsers = Object.keys(global.db?.data?.users || {}).length
    const totalPlugins = Object.keys(global.plugins || {}).length

    // --- IMAGEN DEL MENU, SI FALLA MANDA SIN IMAGEN ---
    let img = null
    try {
      const url = 'https://i.imgur.com/9dG5y9J.jpg' // cambia esta por tu imagen
      const res = await fetch(url)
      if (res.ok) img = Buffer.from(await res.arrayBuffer())
    } catch {}

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
│ ➤ ${usedPrefix}play <texto/link>
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
│ ➤ ${usedPrefix}admin @user
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
│ ➤ ${usedPrefix}claude <texto>
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

    // --- ENVIO QUE FUNCIONA EN NORMAL Y BUSINESS ---
    await conn.sendMessage(m.chat, {
      image: img,
      caption: menu,
      mentions: [m.sender],
      contextInfo: {
        mentionedJid: [m.sender],
        externalAdReply: {
          showAdAttribution: true,
          title: 'GOKU BOT 🐉',
          body: 'Toca para ver el canal',
          thumbnail: img,
          sourceUrl: 'https://whatsapp.com/channel/0029VaJxJXr0gcfN5w5jA71',
          mediaType: 1,
          renderLargerThumbnail: true
        }
      }
    }, { quoted: m })

  } catch (e) {
    console.log(e)
    // Si TODO falla, manda el menú en texto puro, nunca se queda en blanco
    await conn.sendMessage(m.chat, { text: `Menú Goku Bot\n\nEscribe ${usedPrefix}ping para probar` }, { quoted: m })
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
