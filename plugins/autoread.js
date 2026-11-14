import { panel, sign, displayName } from '../lib/economia.js'

import {
  markRead as coreMarkRead, resolveAutoRead, botSettings, chatSettingsOf,
  autoReadLog, readKey as coreReadKey, resetAutoReadLog, isIgnoredChat
} from '../lib/autoread-core.js'

export const markRead = (conn, m) => coreMarkRead(conn, m)
export const readKey = (conn, key) => coreReadKey(conn, key)
export const botSettingsOf = conn => botSettings(conn)
export const chatSettings = m => chatSettingsOf(m?.chat)

/** ¿Está activo el autoread global? */
export const globalAutoRead = conn => {
  const { on, source } = resolveAutoRead(conn, null)
  if (source === 'memoria' || source === 'bot' || source === 'default') {
    // si el chat actual no manda, el global es lo que devuelve resolveAutoRead sin chat
    const s = botSettings(conn)
    if (s.autoread2 === true || s.autoread === true || s.autoRead === true) return true
    if (global.autoreadGlobal === true) return true
    if (global.autoreadGlobal === false) return false
    if (s.autoread2 === false || s.autoread === false || s.autoRead === false) return false
    return true
  }
  return on
}

/** ¿Activo para este chat? Prioridad: chat > global */
export const autoReadEnabled = (m, conn) => resolveAutoRead(conn, m?.chat).on

export const setGlobalAutoRead = (conn, value) => {
  const s = botSettings(conn)
  s.autoread2 = !!value
  s.autoread = !!value
  s.autoRead = !!value
  s.autoreadDefault = true
  global.autoreadGlobal = !!value
  return s.autoread2
}

export const setChatAutoRead = (m, value) => {
  const chat = chatSettingsOf(m?.chat)
  chat.autoread = !!value
  return chat.autoread
}

export const isDev = (m, { isROwner, isOwner } = {}) => {
  if (m.fromMe || isROwner || isOwner) return true
  const num = String(m.sender || '').replace(/[^0-9]/g, '').slice(-9)
  return (global.owner || []).some(o => String(Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, '').slice(-9) === num)
}

/** Diagnóstico detallado */
export const autoReadDebug = (m, conn) => {
  const u = conn?.user || {}
  const all = Object.keys(global.db?.data?.settings || {})
  const me = u.jid || ''
  const log = autoReadLog()
  const filasLog = log.length
    ? log.slice(0, 5).map(l =>
      l.ok
        ? `✅ ${String(l.chat || '').split('@')[0]} · ${l.via}${l.src ? ` (${l.src})` : ''}`
        : `• ${String(l.chat || '').split('@')[0]} · ${l.skip || l.error || 'sin detalle'}`
    )
    : ['sin mensajes procesados todavía']

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
    `🛰️ *listener upsert:* ${global.autoreadUpsertActive ? 'activo' : 'NO (respaldo en handler)'}`,
    `🌍 *global.autoreadGlobal:* ${global.autoreadGlobal === true ? 'on' : global.autoreadGlobal === false ? 'off' : 'sin definir'}`,
    '',
    '*📨 ÚLTIMOS INTENTOS:*',
    ...filasLog
  ].filter(Boolean)
}

// ─────────────────────────────────────────────────────────────
// AUTOREAD AUTOMÁTICO
// ─────────────────────────────────────────────────────────────
export async function before(m, { conn }) {
  if (!m?.message || !m.chat) return false
  if (m.fromMe) return false
  if (global.autoreadUpsertActive) return false // el listener de index.js ya lo hizo
  if (!autoReadEnabled(m, conn)) return false

  await markRead(conn, m).catch(() => {})
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
