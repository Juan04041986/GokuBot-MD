let handler = async (m, { conn }) => {
let act = global.db.data.actividad
let hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })

if (!act || act.fecha !== hoy || !act.total) {
  return conn.sendMessage(m.chat, { text: `*「🐲」 GOKU BOT - ACTIVIDAD DE HOY*\n\n> 😴 Aún no hay actividad hoy, chico.\n> Usa un comando y vuelve a ver.\n\n> 📅 Fecha » *${hoy}*` }, { quoted: m })
}

// Top comandos
let topCmds = Object.entries(act.comandos || {}).sort((a, b) => b[1] - a[1]).slice(0, 5)
let txtCmds = topCmds.map(([c, n], i) => `> ${i+1}. *${c}* - ${n} veces`).join('\n')

// Top usuarios
let topUsers = Object.entries(act.usuarios || {}).sort((a, b) => b[1].total - a[1].total).slice(0, 5)
let txtUsers = ''
for (let i = 0; i < topUsers.length; i++) {
  let [jid, data] = topUsers[i]
  let nombre = await conn.getName(jid).catch(() => jid.split('@')[0])
  txtUsers += `> ${i+1}. *${nombre}* - ${data.total} comandos\n`
}

// Tus stats
let yo = act.usuarios[m.sender]
let miTxt = yo ? `> Tus comandos hoy » *${yo.total}*\n> Tu comando favorito » *${Object.entries(yo.comandos).sort((a,b) => b[1]-a[1])[0][0]}*` : `> Tú aún no usaste ningún comando hoy`

// Últimos 5
let ultimos = (act.ultimos || []).slice(0, 5).map(u => {
  let nombre = u.user.split('@')[0]
  return `> 🕐 *${u.hora}* - @${nombre} usó *${u.cmd}*`
}).join('\n')

let texto = `*「🐲」 GOKU BOT - ACTIVIDAD DE HOY*\n\n> 📅 Fecha » *${hoy}*\n> 📊 Total de comandos hoy » *${act.total}*\n\n*「🔥」 TOP COMANDOS*\n${txtCmds}\n\n*「👑」 TOP USUARIOS*\n${txtUsers}\n*「🫵」 TU ACTIVIDAD*\n${miTxt}\n\n*「🕐」 ÚLTIMOS COMANDOS*\n${ultimos}\n\n> *🐲 GokuBot te está vigilando, chico 🔥*`

await conn.sendMessage(m.chat, { text: texto, mentions: [...Object.keys(act.usuarios || {}).slice(0, 5)] }, { quoted: m })
}

handler.command = ['veractividad', 'actividad', 'activity']
handler.tags = ['info']
export default handler
