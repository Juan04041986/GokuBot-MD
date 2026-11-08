import fetch from 'node-fetch'
import fs from 'fs'
import moment from 'moment-timezone'
import PhoneNumber from 'awesome-phonenumber'

let handler = async (m, { conn, usedPrefix, participants }) => {
try {
const user = global.db.data.users[m.sender] || {}
const name = await conn.getName(m.sender) || 'Usuario'
const premium = user.premium ? '✓' : '✘'
const uptime = clockString(process.uptime() * 1000)
const fecha = new Date(Date.now())
const locale = 'es-AR'
const hora = moment.tz('America/Buenos_Aires').format('HH:mm:ss')

// --- ESTO ES LO QUE FALLABA, AHORA CON RESPALDO ---
const botname = global.botname || 'Goku Bot'
const textbot = global.textbot || 'Goku Bot - Dragon Ball'
const vs = global.vs || '1.0'
const gokuMenu = global.gokuMenu || 'https://i.imgur.com/2qWzXyL.jpg'

// Thumbnail con try, si falla no tumba el menú
let thumb = null
try {
  const res = await fetch(gokuMenu)
  if (res.ok) thumb = Buffer.from(await res.arrayBuffer())
} catch {}

let menuAll = `▢ *Prefix* : (/ # - . ,)
▢ *Usuario* : @${m.sender.split('@')[0]}
▢ *Version* : ${vs}_mx-ls
▢ *Modo* : Privado.
▢ *Uptime* : ${uptime}
▢ *Hora* : ${hora}
${readMore}
⚶⭒ \`Informacion\` 
\t㊙ *${usedPrefix}menuaudio*
\t㊙ *${usedPrefix}grupos*
\t㊙ *${usedPrefix}grupos frikis*
\t㊙ *${usedPrefix}grupos telegram*
\t㊙ *${usedPrefix}grupos facebook*
\t㊙ *${usedPrefix}appsticker*
\t㊙ *${usedPrefix}dar numero*
\t㊙ *${usedPrefix}canal*
\t㊙ *${usedPrefix}noticiasdragonball*
\t㊙ *${usedPrefix}curiosidadesdragonball*
\t㊙ *${usedPrefix}añadirusuario*
\t㊙ *${usedPrefix}dragonballencuestas*
\t㊙ *${usedPrefix}dragonballtelegram*
\t㊙ *${usedPrefix}estado*
\t㊙ *${usedPrefix}ping*
\t㊙ *${usedPrefix}run*
\t㊙ *${usedPrefix}support*

⚶⭒ \`Biografia DB\`
\t📖 *${usedPrefix}biografíagoku*
\t📖 *${usedPrefix}biografíavegeta*
\t📖 *${usedPrefix}biografíagohan*
\t📖 *${usedPrefix}biografíacelula*
\t📖 *${usedPrefix}biografíafreezer*
\t📖 *${usedPrefix}biografíatrunks*
\t📖 *${usedPrefix}biografíajiren*

⚶⭒ \`Descargas\` 
\t⬇️ *${usedPrefix}play*  =  link/text
\t⬇️ *${usedPrefix}ytmp3*  =  link/text
\t⬇️ *${usedPrefix}ytmp4*  =  link/text
\t⬇️ *${usedPrefix}github*  =  link
\t⬇️ *${usedPrefix}mediafire*  =  link
\t⬇️ *${usedPrefix}facebook*  =  link
\t⬇️ *${usedPrefix}instagram*  =  link
\t⬇️ *${usedPrefix}twitter*  =  link
\t⬇️ *${usedPrefix}spotify*  =  link
\t⬇️ *${usedPrefix}pinterest*  =  link
\t⬇️ *${usedPrefix}tiktok*  =  link
\t⬇️ *${usedPrefix}sly*  =  link

⚶⭒ \`Busquedas\` 
\t🔍 *${usedPrefix}google*  =  text
\t🔍 *${usedPrefix}imagen*  =  text
\t🔍 *${usedPrefix}yts*  =  text
\t🔍 *${usedPrefix}apk*  =  text

⚶⭒ \`Grupos\` 
\t🐲 *${usedPrefix}link*
\t🐲 *${usedPrefix}kick*  =  mention
\t🐲 *${usedPrefix}add*  =  number
\t🐲 *${usedPrefix}invocar*  =  text

⚶⭒ \`Convertidor\` 
\tᗢ *${usedPrefix}sticker*  =  reply
\tᗢ *${usedPrefix}togif*  =  reply
\tᗢ *${usedPrefix}jpg*  =  reply

⚶⭒ \`Inteligencia\` 
\tᗢ *${usedPrefix}chatgpt*  =  text
\tᗢ *${usedPrefix}imagina*  =  text

⚶⭒ \`Juegos RPG\` 
\tᗢ *${usedPrefix}minar*
\tᗢ *${usedPrefix}talar*
\tᗢ *${usedPrefix}cazar*
\tᗢ *${usedPrefix}work*
\tᗢ *${usedPrefix}aventura*
\tᗢ *${usedPrefix}coins*
\tᗢ *${usedPrefix}nivel*

⚶⭒ \`Owner\` 
\tᗢ *${usedPrefix}err*
\tᗢ *${usedPrefix}fix*

> ${textbot}`

// --- ESTE ES EL ENVIO QUE FUNCIONA EN NORMAL Y BUSINESS ---
await conn.sendMessage(m.chat, {
  text: menuAll,
  mentions: [m.sender],
  contextInfo: {
    mentionedJid: [m.sender],
    forwardingScore: 999,
    isForwarded: true,
    externalAdReply: {
      showAdAttribution: true,
      title: botname,
      body: textbot,
      thumbnail: thumb, // <-- antes usabas thumbnailUrl, eso lo bloquea en normal
      sourceUrl: 'https://whatsapp.com/channel/0029VaJxJXr0gcfN5w5jA71',
      mediaType: 1,
      renderLargerThumbnail: true
    }
  }
}, { quoted: m })

} catch (e) {
console.error(e)
// Si falla el AdReply, manda el menú simple para que nunca se quede sin salir
await conn.sendMessage(m.chat, { text: `Error, menú simple:\n\nUsa ${usedPrefix}menu`, mentions: [m.sender] }, { quoted: m })
}
}

handler.command = ['menu', 'help', 'menú']
export default handler

const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

function clockString(ms) {
const h = isNaN(ms) ? '--' : Math.floor(ms / 3600000)
const m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60
const s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60
return [h, m, s].map(v => v.toString().padStart(2, '0')).join(':')
       }
