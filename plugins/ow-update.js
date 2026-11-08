import { execSync } from 'child_process'

function isOwnerReal(m, conn) {
  let owners = global.owner || []
  if (global.config?.owner) owners = owners.concat(global.config.owner)
  let ownerNumbers = owners.map(v => {
    let n = Array.isArray(v) ? v[0] : v
    return String(n).replace(/[^0-9]/g, '')
  }).filter(Boolean)
  let myIds = [m.sender, m.key?.participant, m.key?.remoteJid, conn.user?.jid].filter(Boolean)
  let myNumbers = myIds.map(id => String(id).replace(/[^0-9]/g, ''))
  if (m.fromMe) return true
  return myNumbers.some(num => ownerNumbers.some(owner => owner.endsWith(num.slice(-8)) || num.endsWith(owner.slice(-8)) || owner === num))
}

var handler = async (m, { conn, text, isROwner }) => {
  if (!isOwnerReal(m, conn) && !isROwner) {
    return conn.sendMessage(m.chat, { text: `╭───〔 *⛔ SIN PERMISO* 〕───╮\n│\n│ 👤 No eres owner bro\n│ 🆔 Tu ID: ${m.sender}\n│\n╰──────────────────╯` }, { quoted: m })
  }

  await m.react("🔄").catch(() => {})

  // Mensaje de buscando
  let buscando = await conn.sendMessage(m.chat, { text: `╭───〔 *🔄 BUSCANDO ACTUALIZACIÓN* 〕───╮\n│\n│ ⏳ Revisando GitHub...\n│ 📦 Espera un momento...\n│\n╰──────────────────╯` }, { quoted: m })

  try {
    const stdout = execSync('git pull' + (m.fromMe && text ? ' ' + text : '')).toString()
    const hora = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    const fecha = new Date().toLocaleString('es-PE', { timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric' })

    // ── 1. YA ESTÁ ACTUALIZADO ──
    if (stdout.includes('Already up to date')) {
      let msg = `╭───〔 *✅ BOT ACTUALIZADO* 〕───╮
│
│ 📅 *Fecha:* ${fecha}
│ 🕒 *Hora:* ${hora}
│
│ ━━━━━━━━━━━━━━━━━━
│
│ ✨ *No hay nada nuevo*
│ 📦 Ya tienes la última versión
│ 🐉 Tu bot está al día
│
│ ━━━━━━━━━━━━━━━━━━
│
│ 💡 *Estado:* Sin cambios
│
╰──────────────────╯

> *Goku Bot - Sistema de Actualización*`
      return conn.sendMessage(m.chat, { text: msg, edit: buscando.key }, { quoted: m })
    }

    // ── 2. SI HAY ACTUALIZACIÓN ──
    // Saca los archivos que cambiaron
    let archivos = stdout.split('\n').filter(l => l.includes('|')).map(l => '│ 📄 ' + l.trim()).join('\n')
    if (!archivos) archivos = '│ 📄 Se actualizaron archivos del sistema'

    // Saca cuantos archivos cambiaron
    let resumen = stdout.split('\n').find(l => l.includes('file') && l.includes('changed')) || 'Archivos actualizados'

    let msg2 = `╭───〔 *🚀 ACTUALIZACIÓN COMPLETADA* 〕───╮
│
│ 📅 *Fecha:* ${fecha}
│ 🕒 *Hora:* ${hora}
│
│ ━━━━━━━━━━━━━━━━━━
│
│ *📂 ARCHIVOS ACTUALIZADOS:*
${archivos}
│
│ ━━━━━━━━━━━━━━━━━━
│
│ 📊 *Resumen:* ${resumen.trim()}
│ ✅ *Estado:* Actualizado con éxito
│
│ ━━━━━━━━━━━━━━━━━━
│
│ ⚠️ *IMPORTANTE:*
│ 🔄 Reinicia el bot en el panel
│    para aplicar los cambios
│
╰──────────────────╯

> *Goku Bot - Actualizado correctamente 🐉*`

    await conn.sendMessage(m.chat, { text: msg2, edit: buscando.key }, { quoted: m })
    await m.react("✅").catch(() => {})

  } catch (e) {
    // ── 3. SI HAY ERROR ──
    try {
      const status = execSync('git status --porcelain').toString()
      let conflictos = status.split('\n').filter(l => l.trim() !== '' && !l.includes('.npm/') && !l.includes('.cache/') && !l.includes('tmp/') && !l.includes('database.json') && !l.includes('sessions/') && !l.includes('npm-debug.log')).map(l => '│ ❌ ' + l.slice(3)).join('\n')

      let msgError = `╭───〔 *❌ ERROR AL ACTUALIZAR* 〕───╮
│
│ 📍 *Hubo un problema*
│
│ ━━━━━━━━━━━━━━━━━━
│
│ *📂 ARCHIVOS CON CONFLICTO:*
${conflictos || '│ ❌ Error desconocido'}
│
│ ━━━━━━━━━━━━━━━━━━
│
│ 💡 *Solución:*
│ Borra esos archivos o haz
│ git reset --hard en el panel
│
╰──────────────────╯`
      await conn.sendMessage(m.chat, { text: msgError, edit: buscando.key }, { quoted: m })
    } catch (err) {
      await conn.sendMessage(m.chat, { text: `╭───〔 *❌ ERROR* 〕───╮\n│\n│ ${err.message}\n│\n╰──────────────────╯`, edit: buscando.key }, { quoted: m })
    }
  }
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = ['update', 'fix', 'actualizar']
handler.rowner = false
export default handler
