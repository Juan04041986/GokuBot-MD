/**
 * 🐉 Autoread (core) — marca mensajes como leídos en el punto más temprano posible.
 * Se usa desde index.js (messages.upsert) y desde handler.js/plugins como respaldo.
 */

const MAX_LOG = 8
const done = new Set()

const norm = jid => String(jid || '').split(':')[0]
const digits = v => String(v || '').replace(/[^0-9]/g, '')

export const isIgnoredChat = chat =>
  !chat ||
  chat === 'status@broadcast' ||
  chat.endsWith('@broadcast') ||
  chat.endsWith('@newsletter')

/** Todas las claves posibles de settings del bot */
function settingsJids(conn) {
  const u = conn?.user || {}
  const list = [u.jid, u.id ? norm(u.id) + '@s.whatsapp.net' : null, conn?.authState?.creds?.me?.id ? norm(conn.authState.creds.me.id) + '@s.whatsapp.net' : null]
  return list.filter(Boolean)
}

export function botSettings(conn) {
  if (!global.db) global.db = { data: {} }
  if (!global.db.data) global.db.data = {}
  const all = (global.db.data.settings = global.db.data.settings || {})
  for (const jid of settingsJids(conn)) if (all[jid] && typeof all[jid] === 'object') return all[jid]
  return {}
}

export const chatSettingsOf = chat => {
  if (!global.db) global.db = { data: {} }
  if (!global.db.data) global.db.data = {}
  const chats = (global.db.data.chats = global.db.data.chats || {})
  if (!chat) return {}
  if (!chats[chat] || typeof chats[chat] !== 'object') chats[chat] = {}
  return chats[chat]
}

/**
 * ¿Debe marcarse como leído en este chat?
 * Prioridad: ajuste del chat > ajuste del bot > bandera en memoria > ON por defecto
 */
export function resolveAutoRead(conn, chat) {
  const chatCfg = chatSettingsOf(chat)
  if (typeof chatCfg.autoread === 'boolean')
    return { on: chatCfg.autoread, source: 'chat' }

  const s = botSettings(conn)
  if (s.autoread2 === true || s.autoread === true || s.autoRead === true)
    return { on: true, source: 'bot' }
  if (s.autoread2 === false || s.autoread === false || s.autoRead === false) {
    // apagado explícito sólo si no hay bandera en memoria contradictoria
    if (global.autoreadGlobal === true) return { on: true, source: 'memoria' }
    return { on: false, source: 'bot' }
  }

  if (global.autoreadGlobal === true) return { on: true, source: 'memoria' }
  if (global.autoreadGlobal === false) return { on: false, source: 'memoria' }

  // Sin configuración: activado por defecto
  return { on: true, source: 'default' }
}

export function logAutoRead(entry) {
  global.autoreadLog = global.autoreadLog || []
  global.autoreadLog.unshift({ ts: Date.now(), ...entry })
  if (global.autoreadLog.length > MAX_LOG) global.autoreadLog.length = MAX_LOG
  if (entry.ok) global.autoreadLast = { ok: true, chat: entry.chat, id: entry.id, via: entry.via, ts: Date.now() }
}

export const autoReadLog = () => global.autoreadLog || []

/** Intenta marcar leído con todas las vías disponibles */
export async function readKey(conn, key) {
  const attempts = []

  if (typeof conn.readMessages === 'function') {
    try { await conn.readMessages([key]); return { ok: true, via: 'readMessages' } }
    catch (e) { attempts.push('readMessages: ' + (e?.message || e)) }
  }

  if (typeof conn.sendReceipt === 'function') {
    try { await conn.sendReceipt(key.remoteJid, key.participant, [key.id], 'read'); return { ok: true, via: 'sendReceipt' } }
    catch (e) { attempts.push('sendReceipt: ' + (e?.message || e)) }
  }

  if (typeof conn.sendReadReceipt === 'function') {
    try { await conn.sendReadReceipt(key.remoteJid, key.participant, [key.id]); return { ok: true, via: 'sendReadReceipt' } }
    catch (e) { attempts.push('sendReadReceipt: ' + (e?.message || e)) }
  }

  if (typeof conn.chatModify === 'function') {
    try {
      await conn.chatModify({ markRead: true, lastMessages: [{ key, messageTimestamp: Math.floor(Date.now() / 1000) }] }, key.remoteJid)
      return { ok: true, via: 'chatModify' }
    } catch (e) { attempts.push('chatModify: ' + (e?.message || e)) }
  }

  return { ok: false, via: null, error: attempts.join(' | ') || 'sin APIs de lectura' }
}

/** Marca leído un mensaje serializado (m) */
export async function markRead(conn, m) {
  const chat = m?.chat || m?.key?.remoteJid
  const id = m?.key?.id || m?.id
  if (isIgnoredChat(chat) || !id) return false

  const key = { remoteJid: chat, id, fromMe: false }
  const participant = m?.key?.participant || (m?.isGroup ? m?.sender : undefined)
  if (participant) key.participant = participant

  const res = await readKey(conn, key)

  try {
    if (typeof conn.chatModify === 'function' && res.via !== 'chatModify')
      await conn.chatModify({ markRead: true, lastMessages: [{ key, messageTimestamp: m?.messageTimestamp || Math.floor(Date.now() / 1000) }] }, chat)
  } catch {}

  logAutoRead({ ok: res.ok, via: res.via, chat, id, error: res.error, src: 'handler' })
  return res.ok
}

/**
 * Procesa un evento messages.upsert completo.
 * Se ejecuta antes que handler.js, así no depende de plugins ni de comandos.
 */
export async function autoReadUpsert(conn, chatUpdate) {
  try {
    const msgs = chatUpdate?.messages
    if (!Array.isArray(msgs) || !msgs.length) return
    if (chatUpdate.type && chatUpdate.type !== 'notify') return

    for (const msg of msgs) {
      const key = msg?.key
      if (!key?.remoteJid) continue
      const chat = key.remoteJid
      const id = key.id

      if (isIgnoredChat(chat)) continue

      if (!id) { logAutoRead({ ok: false, chat, skip: 'sin id', src: 'upsert' }); continue }
      if (key.fromMe) { logAutoRead({ ok: false, chat, id, skip: 'mensaje propio (fromMe)', src: 'upsert' }); continue }
      if (!msg.message || msg.messageStubType) { logAutoRead({ ok: false, chat, id, skip: 'sin contenido', src: 'upsert' }); continue }

      const { on, source } = resolveAutoRead(conn, chat)
      if (!on) { logAutoRead({ ok: false, chat, id, skip: `autoread apagado (${source})`, src: 'upsert' }); continue }

      if (done.has(id)) continue
      done.add(id)
      if (done.size > 500) done.delete(done.values().next().value)

      const k = { remoteJid: chat, id, fromMe: false }
      if (key.participant) k.participant = key.participant

      const res = await readKey(conn, k)
      try {
        if (typeof conn.chatModify === 'function' && res.via !== 'chatModify')
          await conn.chatModify({ markRead: true, lastMessages: [{ key: k, messageTimestamp: Number(msg.messageTimestamp) || Math.floor(Date.now() / 1000) }] }, chat)
      } catch {}

      logAutoRead({ ok: res.ok, via: res.via, chat, id, error: res.error, src: 'upsert', setting: source })
    }
  } catch (e) {
    console.error('[autoread] upsert:', e?.message || e)
  }
}

export function resetAutoReadLog() {
  global.autoreadLog = []
  done.clear()
}
