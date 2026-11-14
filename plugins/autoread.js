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
      if (typeof conn.sendReadReceipt === 'function') {
        await conn.sendReadReceipt(key.remoteJid, key.participant, [key.id])
        ok = true
      }
    } catch {}
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
  return !!(s.autoread2 ?? s.autoread ?? s.autoRead)
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
  return s.autoread2
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

handler.help = ['autoread [on|off|global on|global off|reset]']
handler.tags = ['main']
handler.command = ['autoread', 'autoleido', 'leido', 'visto']

export default handler
