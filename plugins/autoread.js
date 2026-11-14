import { panel, sign, displayName } from '../lib/economia.js'

/** Clave segura para marcar como leído (soporta grupos, LID y privados) */
export function buildReadKey(m) {
  const chat = m.chat || m.key?.remoteJid
  const id = m.key?.id || m.id
  if (!chat || !id) return null
  if (chat.endsWith('@broadcast') || chat.endsWith('@newsletter')) return null
  const key = { remoteJid: chat, id, fromMe: false }
  const participant = m.key?.participant || (m.isGroup ? m.sender : undefined)
  if (participant) key.participant = participant
  return key
}

/** Marca un mensaje como leído (ticks azules + limpia el contador del chat) */
export async function markRead(conn, m) {
  const key = buildReadKey(m)
  if (!key) return false

  let ok = false

  try {
    await conn.readMessages([key])
    ok = true
  } catch {
    try {
      if (typeof conn.sendReceipt === 'function') {
        await conn.sendReceipt(key.remoteJid, key.participant, [key.id], 'read')
        ok = true
      }
    } catch {}
    if (!ok) {
      try {
        if (typeof conn.sendReadReceipt === 'function') {
          await conn.sendReadReceipt(key.remoteJid, key.participant, [key.id])
          ok = true
        }
      } catch {}
    }
  }

  try {
    if (typeof conn.chatModify === 'function')
      await conn.chatModify({
        markRead: true,
        lastMessages: [{ key, messageTimestamp: m.messageTimestamp || Math.floor(Date.now() / 1000) }]
      }, key.remoteJid)
  } catch {}

  return ok
}

export const botSettings = conn => {
  if (!global.db?.data) return {}
  if (!global.db.data.settings || typeof global.db.data.settings !== 'object') global.db.data.settings = {}
  const jid = conn?.user?.jid || conn?.user?.id
  if (!jid) return {}
  if (!global.db.data.settings[jid] || typeof global.db.data.settings[jid] !== 'object')
    global.db.data.settings[jid] = {}
  return global.db.data.settings[jid]
}

export const chatSettings = m => {
  if (!global.db?.data) return {}
  if (!global.db.data.chats || typeof global.db.data.chats !== 'object') global.db.data.chats = {}
  if (!m.chat) return {}
  if (!global.db.data.chats[m.chat] || typeof global.db.data.chats[m.chat] !== 'object')
    global.db.data.chats[m.chat] = {}
  return global.db.data.chats[m.chat]
}

/** ¿Está activo el autoread global? (compatible con claves viejas) */
export const globalAutoRead = conn => {
  const s = botSettings(conn)
  // Cualquiera de las claves encendida = activo (se mantienen sincronizadas por el comando)
  if (s.autoread2 || s.autoread || s.autoRead) return true
  // respaldo en memoria: funciona aunque el jid del bot cambie (LID/nuevo login)
  if (global.autoreadGlobal === true) return true
  // respaldo final: si alguna sesión guardada tiene el autoread encendido
  const all = global.db?.data?.settings || {}
  return Object.values(all).some(v => v && typeof v === 'object' && (v.autoread2 === true || v.autoread === true || v.autoRead === true))
}

/** ¿Está activo el autoread para este chat? El chat manda sobre lo global */
export const autoReadEnabled = (m, conn) => {
  const chat = chatSettings(m)
  if (typeof chat.autoread === 'boolean') return chat.autoread
  return globalAutoRead(conn)
}

export const setGlobalAutoRead = (conn, value) => {
  const s = botSettings(conn)
  s.autoread2 = !!value
  s.autoread = !!value
  s.autoRead = !!value
  s.autoreadDefault = true
  global.autoreadGlobal = !!value
  return s.autoread2
}

/** Diagnóstico para saber por qué no marca leído */
export const autoReadDebug = (m, conn) => {
  const u = conn?.user || {}
  const all = Object.keys(global.db?.data?.settings || {})
  const me = u.jid || ''
  return [
    `🆔 *user.id:* ${u.id || 'nada'}`,
    `📞 *user.jid:* ${u.jid || 'nada'}`,
    `📞 *user.lid:* ${u.lid || 'nada'}`,
    `⚙️ *settings guardados:* ${all.length ? all.map(j => j.split('@')[0]).join(', ') : 'ninguno'}`,
    `🎯 *settings que leo:* ${me ? me.split('@')[0] : 'ninguno'}`,
    `🔌 *readMessages:* ${typeof conn?.readMessages === 'function' ? 'sí' : 'NO'}`,
    `🔌 *sendReceipt:* ${typeof conn?.sendReceipt === 'function' ? 'sí' : 'NO'}`,
    `🔌 *sendReadReceipt:* ${typeof conn?.sendReadReceipt === 'function' ? 'sí' : 'NO'}`,
    `🔌 *chatModify:* ${typeof conn?.chatModify === 'function' ? 'sí' : 'NO'}`,
    `🌍 *global.autoreadGlobal:* ${global.autoreadGlobal === true ? 'on' : global.autoreadGlobal === false ? 'off' : 'sin definir'}`,
    `📨 *último intento:* ${global.autoreadLast ? `${global.autoreadLast.ok ? '✅' : '❌'} ${global.autoreadLast.chat.split('@')[0]}` : 'ninguno'}`,
    global.autoreadError ? `⚠️ *error:* ${global.autoreadError}` : null
  ].filter(Boolean)
}

export const setChatAutoRead = (m, value) => {
  const chat = chatSettings(m)
  chat.autoread = !!value
  return chat.autoread
}

export const isDev = (m, { isROwner, isOwner } = {}) => {
  if (m.fromMe || isROwner || isOwner) return true
  const num = String(m.sender || '').replace(/[^0-9]/g, '').slice(-9)
  return (global.owner || []).some(o => String(Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, '').slice(-9) === num)
}

// ─────────────────────────────────────────────────────────────
// AUTOREAD AUTOMÁTICO
// ─────────────────────────────────────────────────────────────
export async function before(m, { conn }) {
  if (!m?.message) return false
  if (!m.chat) return false
  if (m.fromMe) return false
  if (!autoReadEnabled(m, conn)) return false

  const delay = Number(botSettings(conn).autoreadDelay) || 0
  const run = () => markRead(conn, m).catch(() => {})
  if (delay > 0) setTimeout(run, delay)
  else await run()

  return false
}

// ─────────────────────────────────────────────────────────────
// COMANDO
// ─────────────────────────────────────────────────────────────
const estado = v => (v ? '✅ ACTIVADO' : '❌ DESACTIVADO')

let handler = async (m, { conn, args, usedPrefix, command, isAdmin, isOwner, isROwner }) => {
  const dev = isDev(m, { isROwner, isOwner })

  const tokens = (args || []).map(a => String(a).toLowerCase())
  const ON = ['on', 'activar', 'activado', 'enable', 'si', 'sí', '1']
  const OFF = ['off', 'desactivar', 'desactivado', 'disable', 'no', '0']
  const GLOB = ['global', 'todo', 'todos', 'all', 'todosloschats']
  const RESET = ['reset', 'heredar', 'default', 'borrar']

  const esReset = tokens.some(t => RESET.includes(t))
  const pedirGlobal = tokens.some(t => GLOB.includes(t))
  const tokOn = tokens.find(t => ON.includes(t))
  const tokOff = tokens.find(t => OFF.includes(t))

  const globalOn = globalAutoRead(conn)
  const chat = chatSettings(m)
  const chatOn = typeof chat.autoread === 'boolean' ? chat.autoread : null
  const efectivo = autoReadEnabled(m, conn)

  // Diagnóstico: .autoread debug
  if (tokens.includes('debug') || tokens.includes('info') || tokens.includes('estado')) {
    return conn.sendMessage(m.chat, {
      text: panel('🧪 AUTOREAD DEBUG', [
        `🌍 *Global:* ${estado(globalOn)}`,
        `💬 *Este chat:* ${chatOn === null ? 'herencia' : estado(chatOn)}`,
        `⚡ *Efectivo:* ${estado(efectivo)}`,
        '',
        ...autoReadDebug(m, conn)
      ], sign())
    }, { quoted: m })
  }

  // Prueba real: marca ESTE mensaje como leído ahora mismo
  if (tokens.includes('test') || tokens.includes('probar') || tokens.includes('prueba')) {
    const ok = await markRead(conn, m)
    return conn.sendMessage(m.chat, {
      text: panel(ok ? '✅ AUTOREAD PROBADO' : '❌ NO SE PUDO MARCAR', [
        ok
          ? '👀 Este mensaje acaba de marcarse como *leído* (mira los ✓✓ azules).'
          : '📌 La API del bot no aceptó la lectura.',
        '',
        ...autoReadDebug(m, conn),
        '',
        `💡 Si sale ❌, mandame este panel para revisarlo.`
      ], sign())
    }, { quoted: m })
  }

  // Estado (sin argumentos válidos)
  if (!esReset && !tokOn && !tokOff) {
    return conn.sendMessage(m.chat, {
      text: panel('👀 AUTOREAD', [
        `👤 *Usuario:* ${displayName(m, conn)}`,
        '',
        `🌍 *Global:* ${estado(globalOn)}`,
        `💬 *Este chat:* ${chatOn === null ? 'herencia del global' : estado(chatOn)}`,
        `⚡ *Funcionando ahora:* ${estado(efectivo)}`,
        '',
        '*⚶ Comandos:*',
        `⧡ *${usedPrefix + command} on* — activar ${m.isGroup ? 'en este grupo' : 'global'}`,
        `⧡ *${usedPrefix + command} off* — desactivar ${m.isGroup ? 'en este grupo' : 'global'}`,
        `⧡ *${usedPrefix + command} global on* — activar en todos los chats`,
        `⧡ *${usedPrefix + command} global off* — desactivar en todos`,
        `⧡ *${usedPrefix + command} reset* — volver a heredar el global`,
        '',
        '💡 Marca los mensajes como *leídos* al instante (ticks azules) y limpia el contador del chat.'
      ], sign()),
      mentions: [m.sender]
    }, { quoted: m })
  }

  // Alcance global (solo owner)
  const esGlobal = pedirGlobal || !m.isGroup
  const activar = !!tokOn

  if (esGlobal) {
    if (!dev) return global.dfail('owner', m, conn)
    setGlobalAutoRead(conn, activar)
    if (activar) delete chat.autoread
    return conn.sendMessage(m.chat, {
      text: panel(activar ? '👀 AUTOREAD ACTIVADO' : '👀 AUTOREAD DESACTIVADO', [
        `🌍 *Alcance:* todos los chats`,
        `📌 *Estado:* ${estado(activar)}`,
        '',
        activar
          ? '✅ El bot marcará *todos* los mensajes como leídos al instante.'
          : '❌ El bot ya no marcará los mensajes como leídos.',
        '',
        `💡 Guardado en la base de datos, sigue igual después de reiniciar.`
      ], sign())
    }, { quoted: m })
  }

  // Alcance por grupo (admin u owner)
  if (!(isAdmin || dev)) return global.dfail('admin', m, conn)

  if (esReset) {
    delete chat.autoread
    return conn.sendMessage(m.chat, {
      text: panel('👀 AUTOREAD RESET', [
        '💬 Este grupo vuelve a usar el ajuste global.',
        '',
        `🌍 *Global:* ${estado(globalOn)}`,
        `⚡ *Funcionando ahora:* ${estado(globalAutoRead(conn))}`
      ], sign())
    }, { quoted: m })
  }

  setChatAutoRead(m, activar)
  return conn.sendMessage(m.chat, {
    text: panel(activar ? '👀 AUTOREAD ACTIVADO' : '👀 AUTOREAD DESACTIVADO', [
      `💬 *Alcance:* este grupo`,
      `📌 *Estado:* ${estado(activar)}`,
      '',
      activar
        ? '✅ En este grupo el bot marcará los mensajes como leídos.'
        : '❌ En este grupo el bot no marcará como leídos.',
      '',
      `💡 Para todos los chats: *${usedPrefix + command} global ${activar ? 'on' : 'off'}*`
    ], sign())
  }, { quoted: m })
}

handler.help = ['autoread [on|off|global on|global off|reset|test|debug]']
handler.tags = ['main']
handler.command = ['autoread', 'autoleido', 'leido', 'visto']

// El cargador (lib/plugins.js) solo conserva el export default,
// así que el hook y los helpers se cuelgan como propiedades del handler.
handler.before = before
handler.markRead = markRead
handler.autoReadEnabled = autoReadEnabled
handler.globalAutoRead = globalAutoRead
handler.setGlobalAutoRead = setGlobalAutoRead
handler.autoReadDebug = autoReadDebug

export default handler
