import fetch from 'node-fetch'
import fs from 'fs'
let handler = async (m, {conn, usedPrefix, command, args, isOwner, isAdmin, isROwner, text}) => {
let chat = global.db.data.chats[m.chat]
let user = global.db.data.users[m.sender]
let bot = global.db.data.settings[conn.user.jid] || {}
let toUser = `${m.sender.split('@')[0]}`
let aa = toUser + '@s.whatsapp.net'
let name = await conn.getName(m.sender)
let isEnable = /true|enable|(turn)?on|1/i.test(command)
let type = (args[0] || '').toLowerCase()
let opciones = `· ┄ · ⊸ 𔓕 *Ajustes : Settings*

\t📍 Puedes desactivar o activar comandos segun tu preferencia.

\t＃ *Funciones* : *19* results
\t＃ *Tipo* : admins

\t⚶ Ejemplo de uso:
*${usedPrefix + command}* descargas
${readMore}
⧡ *${usedPrefix}on/off* welcome
⧡ *${usedPrefix}on/off* admin
⧡ *${usedPrefix}on/off* enlaces
⧡ *${usedPrefix}on/off* informacion
⧡ *${usedPrefix}on/off* descargas
⧡ *${usedPrefix}on/off* juegos
⧡ *${usedPrefix}on/off* buscador
⧡ *${usedPrefix}on/off* convertidor
⧡ *${usedPrefix}on/off* stickers
⧡ *${usedPrefix}on/off* autosticker
⧡ *${usedPrefix}on/off* grupos
⧡ *${usedPrefix}on/off* rpg
⧡ *${usedPrefix}on/off* economia
⧡ *${usedPrefix}on/off* ia
⧡ *${usedPrefix}on/off* chatbot
⧡ *${usedPrefix}on/off* ajustes
⧡ *${usedPrefix}on/off* logos
⧡ *${usedPrefix}on/off* random
⧡ *${usedPrefix}on/off* react
⧡ *${usedPrefix}on/off* owners

> ${textbot}`
//await conn.sendMessage(m.chat, { text: opciones }, { quoted: m })
let isAll = false,
isUser = false
switch (type) {
case 'welcome':
case 'bienvenida': {
if (!m.isGroup) {
if (!isOwner) {
global.dfail('group', m, conn)
throw false
}} else if (!isAdmin) {
global.dfail('admin', m, conn)
throw false
}
chat.welcome = isEnable
break
}

case 'admins': {
if (!m.isGroup) {
if (!isOwner) {
global.dfail('group', m, conn)
throw false
}} else if (!isAdmin) {
global.dfail('admin', m, conn)
throw false
}
chat.fAdmin = isEnable
break
}

case 'enlaces':
case 'links': {
if (!m.isGroup) {
if (!isOwner) {
global.dfail('group', m, conn)
throw false
}} else if (!isAdmin) {
global.dfail('admin', m, conn)
throw false
}
chat.fEnlaces = isEnable
break
}

case 'descargas':
case 'downloads':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}}
chat.fDescargas = isEnable
break

case 'buscador':
case 'search':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fSearch = isEnable
break

    case 'audios':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.fAudios = isEnable
      break
        
case 'stickers':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fStickers = isEnable
break

case 'shop':
case 'tienda':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fTienda = isEnable
break

case 'game':
case 'juegos':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fJuegos = isEnable
break

case 'rpg':
case 'economía':
case 'economia':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fRpg = isEnable
break

case 'ia':
case 'inteligencia':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fAis = isEnable
break

case 'chatbot':
case 'autoresponder':
case 'aibot':
case 'chatia':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fChatgp = isEnable
break

case 'info':
case 'informacion':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fInformation = isEnable
break

case 'ajustes':
case 'settings':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fAjustes = isEnable
break

case 'random':
case 'rd':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fRandom = isEnable
break

case 'reaction':
case 'react':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fReaction = isEnable
break

case 'utils':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fUtils = isEnable
break

case 'convert':
case 'convertidor':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fConvert = isEnable
break

case 'owners':
case 'propietarios':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fOwners = isEnable
break

case 'juegos':
case 'games':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fJuegos = isEnable
break

case 'logos':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fLogos = isEnable
break

    case 'autosticker':
      if (m.isGroup) {
        if (!(isAdmin || isOwner)) {
          global.dfail('admin', m, conn)
          throw false
        }
      }
      chat.fAutoStick = isEnable
      break

case 'group':
case 'grupos':
if (m.isGroup) {
if (!(isAdmin || isOwner)) {
global.dfail('admin', m, conn)
throw false
}
}
chat.fGrupos = isEnable
break

default:
if (!/[01]/.test(command))
return await conn.sendMessage(m.chat, { text: opciones }, { quoted: m })
throw false
}
await conn.sendMessage(m.chat, { text: `✅  Se ha ${isEnable ? 'activado' : 'desactivado'} la opción *[ ${type} ]*` }, { quoted: m })
}
handler.command = ["on", "off"]
handler.admin = true
export default handler
const more = String.fromCharCode(8206)
const readMore = more.repeat(4001)

