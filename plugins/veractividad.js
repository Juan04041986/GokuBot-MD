// ===== TODO EN UNO: autoread + actividad + antiprivado + veractividad =====

export async function before(m, { conn, isAdmin, isROwner }) {
if (m.isBaileys && m.fromMe) return false
if (!m.message) return true

// 0. AUTOREAD - marca como leído todo lo que le llega
try {
  if (m.key) await conn.readMessages([m.key])
} catch (e) {}

// 1. REGISTRAR ACTIVIDAD
try {
  let prefix = global.prefix || '.'
  let pref = Array.isArray(prefix) ? prefix.find(p => m.text?.startsWith(p)) : (m.text?.startsWith(prefix) ? prefix : null)
  if (pref && m.text) {
    let cmd = m.text.slice(pref.length).trim().split(' ')[0].toLowerCase()
    if (cmd) {
      let hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
      if (!global.db.data.actividad) global.db.data.actividad = {}
      if (global.db.data.actividad.fecha !== hoy) {
        global.db.data.actividad = { fecha: hoy, total: 0, usuarios: {}, comandos: {}, ultimos: [] }
      }
      let act = global.db.data.actividad
      act.total = (act.total || 0) + 1
      act.comandos[cmd] = (act.comandos[cmd] || 0) + 1
      if (!act.usuarios[m.sender]) act.usuarios[m.sender] = { total: 0, comandos: {}, ultimos: [] }
      act.usuarios[m.sender].total += 1
      act.usuarios[m.sender].comandos[cmd] = (act.usuarios[m.sender].comandos[cmd] || 0) + 1
      act.usuarios[m.sender].ultimos.unshift({ cmd, texto: m.text.slice(0, 60), hora: new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }) })
      if (act.usuarios[m.sender].ultimos.length > 15) act.usuarios[m.sender].ultimos = act.usuarios[m.sender].ultimos.slice(0, 15)
      act.ultimos.unshift({ user: m.sender, cmd, texto: m.text.slice(0, 60), hora: new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }) })
      if (act.ultimos.length > 20) act.ultimos = act.ultimos.slice(0, 20)
    }
  }
} catch (e) { console.log('[ACTIVIDAD]', e.message) }

// 2. ANTIPRIVADO
if (m.isGroup) return false
if (m.sender === conn.user?.jid) return false
if (m.text?.includes('PIEDRA') || m.text?.includes('PAPEL') || m.text?.includes('TIJERA') || m.text?.includes('code') || m.text?.includes('qr')) return true
const bot = global.db.data.settings[conn.user.jid] || {}
if (isROwner || isAdmin) return false
const owners = (global.owner || []).map(v => {
  let num = Array.isArray(v) ? v[0] : v
  return String(num).replace(/[^0-9]/g, '') + '@s.whatsapp.net'
})
if (owners.includes(m.sender)) return false
let mensajito = `📍  Hola usuario @${m.sender.split`@`[0]}\n- No puedes hablar individualmente con el bot.\n\n💪🏻 Te sugerimos que uses el bot en un chat grupal, sea alojado o principal.\n\nGracias por leer.`
if (m.chat === '120363402356085997@newsletter') return true
if (bot.fPrivado) {
  await conn.sendMessage(m.chat, { text: mensajito, mentions: await conn.parseMention(mensajito) }, { quoted: m })
  await conn.updateBlockStatus(m.chat, 'block')
}
return false
}

// 3. COMANDOS: .veractividad y .autoread
let handler = async (m, { conn, usedPrefix, command, args }) => {
try {
// --- .autoread on / off ---
if (command === 'autoread') {
  let bot = global.db.data.settings[conn.user.jid] || {}
  if (!global.db.data.settings[conn.user.jid]) global.db.data.settings[conn.user.jid] = {}
  bot = global.db.data.settings[conn.user.jid]
  let opcion = (args[0] || '').toLowerCase()
  if (opcion === 'on') {
    bot.autoRead = true
    return conn.sendMessage(m.chat, { text: `*« 🐲 »* Autoread *ACTIVADO* ✅\n\nAhora el bot marca como leído todos los mensajes.` }, { quoted: m })
  }
  if (opcion === 'off') {
    bot.autoRead = false
    return conn.sendMessage(m.chat, { text: `*« 🐲 »* Autoread *DESACTIVADO* ❌` }, { quoted: m })
  }
  return conn.sendMessage(m.chat, { text: `*« 🐲 »* Autoread: *${bot.autoRead ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}*\n\nUsa:\n*${usedPrefix}autoread on*\n*${usedPrefix}autoread off*` }, { quoted: m })
}

// --- .veractividad ---
let act = global.db.data.actividad
let hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
if (!act || act.fecha !== hoy || !act.total) {
  return conn.sendMessage(m.chat, { text: `*「🐲」 GOKU BOT - ACTIVIDAD DE HOY*\n\n> 😴 Aún no hay actividad hoy, chico.\n\n> 📅 Fecha » *${hoy}*` }, { quoted: m })
}
let target = m.mentionedJid?.[0] || (m.quoted ? m.quoted.sender : null)
if (target) {
  let data = act.usuarios[target]
  if (!data) return conn.sendMessage(m.chat, { text: `> 😴 @${target.split('@')[0]} no ha usado ningún comando hoy.` , mentions: [target] }, { quoted: m })
  let lista = Object.entries(data.comandos).sort((a,b) => b[1]-a[1]).map(([c,n],i) => `> ${i+1}. *${c}* - ${n} veces`).join('\n')
  let ultimos = data.ultimos.map(u => `> 🕐 *${u.hora}* - *${u.cmd}* - ${u.texto}`).join('\n')
  return conn.sendMessage(m.chat, { text: `*「🐲」 ACTIVIDAD DE @${target.split('@')[0]}*\n\n> 📅 Fecha » *${hoy}*\n> 📊 Total hoy » *${data.total} comandos*\n\n*「🔥」 LO QUE USÓ:*\n${lista}\n\n*「🕐」 ÚLTIMOS:*\n${ultimos}` , mentions: [target] }, { quoted: m })
}
let topCmds = Object.entries(act.comandos || {}).sort((a,b) => b[1]-a[1]).slice(0,5).map(([c,n],i) => `> ${i+1}. *${c}* - ${n} veces`).join('\n')
let topUsers = Object.entries(act.usuarios || {}).sort((a,b) => b[1].total-a[1].total).slice(0,5).map(([jid,data],i) => `> ${i+1}. @${jid.split('@')[0]} - ${data.total} comandos`).join('\n')
let yo = act.usuarios[m.sender]
let miTxt = yo ? `> Tus comandos hoy » *${yo.total}*\n> Tu favorito » *${Object.entries(yo.comandos).sort((a,b)=>b[1]-a[1])[0][0]}*` : `> Tú aún no usaste ningún comando hoy`
let ultimos = (act.ultimos || []).slice(0,5).map(u => `> 🕐 *${u.hora}* - @${u.user.split('@')[0]} usó *${u.cmd}*`).join('\n')
let texto = `*「🐲」 GOKU BOT - ACTIVIDAD DE HOY*\n\n> 📅 Fecha » *${hoy}*\n> 📊 Total hoy » *${act.total}*\n\n*「🔥」 TOP COMANDOS*\n${topCmds}\n\n*「👑」 TOP USUARIOS*\n${topUsers}\n\n*「🫵」 TU ACTIVIDAD*\n${miTxt}\n\n*「🕐」 ÚLTIMOS*\n${ultimos}\n\n> Tip: *${usedPrefix}veractividad @usuario* para ver lo que usó esa persona`
await conn.sendMessage(m.chat, { text: texto, mentions: [...Object.keys(act.usuarios || {}).slice(0,5)] }, { quoted: m })
} catch (e) {
  console.log('[VERACTIVIDAD]', e)
  await conn.sendMessage(m.chat, { text: `❌ Error: ${e.message}` }, { quoted: m })
}
}
handler.command = ['veractividad', 'actividad', 'activity', 'autoread']
handler.tags = ['info']
export default handler
