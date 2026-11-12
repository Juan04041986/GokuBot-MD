import { chatWithMemory, clearMemory, isBotAiMessage, rememberBotAiMessage } from '../lib/ai.js'

const activeChats = new Set()
const lastReplyAt = new Map()
const REPLY_COOLDOWN_MS = 1500
const COMMAND_PREFIX_RE = /^[#!./-]/

function normalizeNum(jid) {
  return String(jid || '')
    .split(':')[0]
    .split('@')[0]
    .replace(/[^0-9]/g, '')
}

function getBotIds(conn, participants = []) {
  const raw = [
    conn?.user?.jid,
    conn?.user?.id,
    conn?.user?.lid
  ].filter(Boolean)

  const jids = new Set()
  const nums = new Set()

  const addId = (id) => {
    if (!id) return
    const s = String(id).trim()
    const base = s.includes(':') ? `${s.split(':')[0]}@${s.split('@')[1] || 's.whatsapp.net'}` : s
    jids.add(s)
    jids.add(base)
    const num = normalizeNum(s)
    if (num) nums.add(num)
  }

  for (const id of raw) addId(id)

  if (Array.isArray(participants)) {
    for (const p of participants) {
      const pNum = normalizeNum(p?.phoneNumber || p?.jid || p?.id)
      if (pNum && nums.has(pNum)) {
        addId(p?.id)
        addId(p?.lid)
        addId(p?.jid)
        addId(p?.phoneNumber)
      }
    }
  }

  return { jids, nums }
}

function matchesBotId(jid, botIds) {
  if (!jid) return false
  const s = String(jid).trim()
  if (botIds.jids.has(s)) return true
  const num = normalizeNum(s)
  return Boolean(num && botIds.nums.has(num))
}

function esOwnerManual(m, conn) {
  if (m.fromMe) return true
  const senderNum = normalizeNum(m.sender)
  let owners = global.owner || []
  if (typeof owners === 'string') owners = [owners]
  if (!Array.isArray(owners)) owners = [owners]

  for (const o of owners) {
    let raw = ''
    if (Array.isArray(o)) raw = String(o[0] || '')
    else if (typeof o === 'object' && o !== null) raw = String(o.number || o.jid || '')
    else raw = String(o || '')
    const ownerNum = raw.replace(/[^0-9]/g, '')
    if (ownerNum && senderNum && (ownerNum === senderNum || ownerNum.endsWith(senderNum.slice(-8)) || senderNum.endsWith(ownerNum.slice(-8)))) {
      return true
    }
  }

  if (global.db?.data?.users?.[m.sender]?.role === 'owner') return true
  if (conn?.user?.jid && m.sender === conn.user.jid) return true
  return false
}

function stripBotMentions(text, botIds) {
  let out = String(text || '')
  for (const num of botIds.nums) {
    out = out.replace(new RegExp(`@${num}\\b`, 'gi'), '')
  }
  return out.replace(/\s+/g, ' ').trim()
}

function ensureDbStructs(m, conn) {
  if (!global.db.data.chats[m.chat]) global.db.data.chats[m.chat] = {}
  const botJid = conn?.user?.jid || 'default'
  if (!global.db.data.settings[botJid]) global.db.data.settings[botJid] = {}
  return {
    chat: global.db.data.chats[m.chat],
    botSettings: global.db.data.settings[botJid]
  }
}

export async function before(m, { conn, participants, isAdmin, isOwner, isROwner }) {
  if (!m.message || typeof m.text !== 'string') return false
  if (m.isBaileys || m.fromMe) return false
  if (m.chat === 'status@broadcast' || m.isChannel) return false

  const chat = global.db?.data?.chats?.[m.chat] || {}
  const botJid = conn?.user?.jid
  const botSettings = (botJid && global.db?.data?.settings?.[botJid]) || {}
  const user = global.db?.data?.users?.[m.sender] || {}

  if (chat.isBanned || chat.isMute || user.banned) return false

  const ownerAccess = Boolean(isOwner || isROwner || esOwnerManual(m, conn))
  if (!m.isGroup && botSettings.fPrivado && !ownerAccess && !isAdmin) return false

  const rawText = m.text.trim()
  if (!rawText) return false

  // No interceptar comandos con prefijo (# . ! / -)
  const prefixRe = global.prefix instanceof RegExp ? global.prefix : COMMAND_PREFIX_RE
  if (prefixRe.test(rawText) || COMMAND_PREFIX_RE.test(rawText)) return false

  // Evitar interferir con selecciones numéricas o juegos de una sola letra (#yts, #spotify, #ahorcado)
  if (/^(?:[av]?\d{1,2}|[a-z])$/i.test(rawText)) return false

  const groupParts = participants || conn?.chats?.[m.chat]?.participants || []
  const botIds = getBotIds(conn, groupParts)
  const mentionedList = Array.isArray(m.mentionedJid) ? m.mentionedJid : []
  const isMentioned =
    mentionedList.some((j) => matchesBotId(j, botIds)) ||
    Array.from(botIds.nums).some((num) => new RegExp(`@${num}\\b`).test(rawText))

  const quotedId = m.quoted?.id || m.quoted?.key?.id || ''
  const isQuotedBot = Boolean(m.quoted && (m.quoted.fromMe || matchesBotId(m.quoted.sender, botIds)))
  const isReplyToAi = Boolean((quotedId && isBotAiMessage(quotedId)) || isQuotedBot)

  const chatbotEnabled = Boolean(chat.fChatgp || botSettings.fAiBot)
  const aiAllowed = chat.fAis !== false

  const shouldRespond = chatbotEnabled
    ? rawText.length >= 2 || isMentioned || isReplyToAi
    : aiAllowed && (isMentioned || (quotedId && isBotAiMessage(quotedId)))

  if (!shouldRespond) return false

  if (activeChats.has(m.chat)) return false
  const prevTs = lastReplyAt.get(m.chat) || 0
  if (Date.now() - prevTs < REPLY_COOLDOWN_MS) return false

  const cleanedPrompt = stripBotMentions(rawText, botIds) || 'Hola'
  const quotedText = (m.quoted?.text || m.quoted?.caption || '').trim()

  activeChats.add(m.chat)
  try {
    await conn.sendPresenceUpdate('composing', m.chat).catch(() => {})
    const speakerName = m.isGroup
      ? m.pushName || (await conn.getName(m.sender).catch(() => '')) || 'Usuario'
      : ''

    const { text: reply } = await chatWithMemory({
      sessionKey: `chatbot:${m.chat}`,
      prompt: cleanedPrompt,
      mode: 'chatbot',
      speakerName,
      quotedText: quotedText && quotedText !== cleanedPrompt ? quotedText : '',
      maxTokens: 500,
      maxHistory: 12
    })

    const sent = await conn.sendMessage(m.chat, { text: reply }, { quoted: m })
    rememberBotAiMessage(sent?.key?.id)
    lastReplyAt.set(m.chat, Date.now())
  } catch (err) {
    console.error('[CHATBOT ERROR]', err?.message || err)
  } finally {
    activeChats.delete(m.chat)
  }

  return true
}

let handler = async (m, { conn, args, text, usedPrefix, command, isAdmin, isOwner, isROwner }) => {
  const { chat, botSettings } = ensureDbStructs(m, conn)
  const ownerAccess = Boolean(isOwner || isROwner || esOwnerManual(m, conn))
  const canToggle = !m.isGroup || Boolean(isAdmin) || ownerAccess
  const sub = (args[0] || '').toLowerCase()
  const isSingleWordControl = command !== 'bot' || args.length <= 1

  if (isSingleWordControl && (sub === 'on' || sub === 'activar' || sub === 'enable' || sub === '1')) {
    if (!canToggle) {
      return conn.sendMessage(m.chat, { text: global.fargs?.admins || '㊙️ *Solo administradores...*' }, { quoted: m })
    }
    chat.fChatgp = true
    return conn.sendMessage(
      m.chat,
      {
        text: `*« 🤖 »* Chatbot *ACTIVADO* ✅\n\nAhora responderé automáticamente en este chat con la personalidad de *GokuBot*.\n\n> Usa *${usedPrefix}chatbot off* para desactivarlo o *${usedPrefix}chatbot reset* para reiniciar la memoria.`
      },
      { quoted: m }
    )
  }

  if (isSingleWordControl && (sub === 'off' || sub === 'desactivar' || sub === 'disable' || sub === '0')) {
    if (!canToggle) {
      return conn.sendMessage(m.chat, { text: global.fargs?.admins || '㊙️ *Solo administradores...*' }, { quoted: m })
    }
    chat.fChatgp = false
    return conn.sendMessage(
      m.chat,
      {
        text: `*« 🤖 »* Chatbot *DESACTIVADO* ❌\n\nYa no responderé automáticamente a todos los mensajes.\n> Igual puedes hablarme con *${usedPrefix}bot <mensaje>* o mencionándome.`
      },
      { quoted: m }
    )
  }

  if (isSingleWordControl && (sub === 'reset' || sub === 'limpiar' || sub === 'clear' || sub === 'reiniciar')) {
    clearMemory(`chatbot:${m.chat}`)
    return conn.sendMessage(
      m.chat,
      { text: `🧹 *Memoria del chatbot reiniciada para este chat.*` },
      { quoted: m }
    )
  }

  if (sub === 'global' && command !== 'bot') {
    if (!ownerAccess) {
      return conn.sendMessage(m.chat, { text: global.fargs?.prop || '㊙️ *Solo el propietario puede usar esta opción...*' }, { quoted: m })
    }
    const gOpt = (args[1] || '').toLowerCase()
    if (gOpt === 'on' || gOpt === 'activar' || gOpt === 'enable') {
      botSettings.fAiBot = true
      return conn.sendMessage(m.chat, { text: `*« 🌐 »* Chatbot global *ACTIVADO* ✅ en todos los chats.` }, { quoted: m })
    }
    if (gOpt === 'off' || gOpt === 'desactivar' || gOpt === 'disable') {
      botSettings.fAiBot = false
      return conn.sendMessage(m.chat, { text: `*« 🌐 »* Chatbot global *DESACTIVADO* ❌.` }, { quoted: m })
    }
    return conn.sendMessage(
      m.chat,
      { text: `*« 🌐 »* Chatbot global: *${botSettings.fAiBot ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'}*\n\nUsa:\n*${usedPrefix}chatbot global on*\n*${usedPrefix}chatbot global off*` },
      { quoted: m }
    )
  }

  if (command === 'bot' && (text || '').trim()) {
    if (m.isGroup && chat.fAis === false && !chat.fChatgp && !botSettings.fAiBot) {
      return conn.sendMessage(
        m.chat,
        { text: `📍  Los comandos de *[ inteligencia artificial ]* estan desactivados...` },
        { quoted: m }
      )
    }

    await m.react('⏰').catch(() => {})
    await conn.sendPresenceUpdate('composing', m.chat).catch(() => {})
    try {
      const speakerName = m.isGroup
        ? m.pushName || (await conn.getName(m.sender).catch(() => '')) || 'Usuario'
        : ''
      const quotedText = (m.quoted?.text || m.quoted?.caption || '').trim()
      const prompt = (text || '').trim()

      const { text: reply } = await chatWithMemory({
        sessionKey: `chatbot:${m.chat}`,
        prompt,
        mode: 'chatbot',
        speakerName,
        quotedText: quotedText && quotedText !== prompt ? quotedText : '',
        maxTokens: 600,
        maxHistory: 12
      })

      const sent = await conn.sendMessage(m.chat, { text: reply }, { quoted: m })
      rememberBotAiMessage(sent?.key?.id)
      await m.react('✅').catch(() => {})
    } catch (err) {
      await m.react('❌').catch(() => {})
      await conn.sendMessage(
        m.chat,
        { text: `❌ No pude responder ahora mismo.\n> ${err?.message || err}` },
        { quoted: m }
      )
    }
    return
  }

  const estadoChat = chat.fChatgp ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'
  const estadoGlobal = botSettings.fAiBot ? 'ACTIVADO ✅' : 'DESACTIVADO ❌'

  return conn.sendMessage(
    m.chat,
    {
      text: `*« 🤖 »* *GokuBot Chatbot*\n\n• *Estado en este chat:* ${estadoChat}\n• *Estado global:* ${estadoGlobal}\n\n*Comandos:*\n➤ *${usedPrefix}chatbot on* — Activar respuesta automática\n➤ *${usedPrefix}chatbot off* — Desactivar respuesta automática\n➤ *${usedPrefix}chatbot reset* — Reiniciar memoria del chat\n➤ *${usedPrefix}bot <mensaje>* — Hablar directo con GokuBot\n➤ También puedes *@mencionarme* o *responder* a mis mensajes de IA.`
    },
    { quoted: m }
  )
}

handler.command = ['chatbot', 'autoresponder', 'bot']
handler.tags = ['ia']
export default handler
