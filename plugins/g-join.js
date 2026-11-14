import { panel, sign, displayName, fmt, BRAND } from '../lib/economia.js'

const RE_LINK = /(?:https?:\/\/)?(?:www\.)?chat\.whatsapp\.com\/(?:invite\/)?([0-9A-Za-z_-]{10,})/i

const cleanCode = text => {
  if (!text) return null
  const m = String(text).match(RE_LINK)
  const code = m ? m[1] : (String(text).trim().match(/^[0-9A-Za-z_-]{15,}$/) ? String(text).trim() : null)
  return code ? code.replace(/[^0-9A-Za-z_-]/g, '') : null
}

const isDev = (m, { isROwner, isOwner } = {}) => {
  if (m.fromMe || isROwner || isOwner) return true
  const num = String(m.sender || '').replace(/[^0-9]/g, '').slice(-9)
  return (global.owner || []).some(o => String(Array.isArray(o) ? o[0] : o).replace(/[^0-9]/g, '').slice(-9) === num)
}

const numOf = jid => {
  const jidStr = jid?.id || jid
  return String(jidStr || '').split('@')[0]
}

const yaEstoy = jid => {
  const j = String(jid || '')
  if (!j) return false
  if (global.db?.data?.chats && global.db.data.chats[j]?.metadata) return true
  return !!(global.conn?.chats && global.conn.chats[j])
}

/** Extrae el código de una invitación de cualquier texto */
export const inviteCode = cleanCode

let handler = async (m, { conn, args, text, usedPrefix, command, isOwner, isROwner }) => {
  const dev = isDev(m, { isROwner, isOwner })

  const ayuda = panel('🔗 UNIRSE A GRUPO', [
    `👤 *Usuario:* ${displayName(m, conn)}`,
    '',
    '📍 Pega el enlace de invitación del grupo.',
    '',
    '*⚶ Ejemplos:*',
    `⧡ *${usedPrefix + command}* https://chat.whatsapp.com/AbCdEf123456`,
    `⧡ *${usedPrefix + command}* AbCdEf123456`,
    `⧡ *${usedPrefix + command} info* https://chat.whatsapp.com/...`,
    `⧡ *${usedPrefix + command} confirmar* https://chat.whatsapp.com/...`,
    '',
    '💡 *info* muestra los datos del grupo sin entrar.',
    '🛡️ *confirmar* entra directo (solo owner/cuando ya te mostró los datos).'
  ], sign())

  if (!args.length) return conn.sendMessage(m.chat, { text: ayuda }, { quoted: m })

  // Subcomandos opcionales: info / confirmar
  let sub = 'auto'
  if (['info', 'ver', 'datos'].includes((args[0] || '').toLowerCase())) { sub = 'info'; args = args.slice(1) }
  else if (['confirmar', 'confirm', 'si', 'sí', 'entrar'].includes((args[0] || '').toLowerCase())) { sub = 'entrar'; args = args.slice(1) }

  const code = cleanCode(args.join(' ') || text)
  if (!code)
    return conn.sendMessage(m.chat, {
      text: panel('🔗 UNIRSE A GRUPO', [
        '❌ Ese no parece un enlace válido.',
        '',
        '📍 Ejemplo: *https://chat.whatsapp.com/AbCdEf123456*'
      ], sign())
    }, { quoted: m })

  await m.react?.('🔎').catch?.(() => {})

  // 1️⃣ Datos del grupo (sin unirse)
  let info = null
  try {
    if (typeof conn.groupGetInviteInfo === 'function')
      info = await conn.groupGetInviteInfo(code)
  } catch (e) {
    info = null
  }

  const descripcion = info
    ? panel('🔍 GRUPO ENCONTRADO', [
      info.subject ? `🏷️ *Nombre:* ${info.subject}` : null,
      info.size ? `👥 *Miembros:* ${fmt(info.size)}` : null,
      info.owner ? `👑 *Creador:* @${numOf(info.owner)}` : null,
      info.creation ? `📅 *Creado:* ${new Date(info.creation * 1000).toLocaleDateString('es-PE')}` : null,
      info.announce ? '📢 *Solo admins escriben*' : null,
      info.restrict ? '🔒 *Solo admins editan*' : null,
      '',
      info.desc ? `📝 *Descripción:*\n${String(info.desc).slice(0, 240)}` : null
    ], '> ✔️ Usa: *' + usedPrefix + command + ' confirmar <link>* para unirme\n> ⚡ ' + BRAND + ' ⚡')
    : panel('🔍 ENLACE RECIBIDO', [
      '⚠️ No pude leer los datos del grupo (enlace privado o vencido).',
      '',
      `🔗 *Código:* ${code}`,
      '💡 Prueba con *' + usedPrefix + command + ' confirmar <link>*'
    ], sign())

  if (sub === 'info')
    return conn.sendMessage(m.chat, {
      text: descripcion,
      mentions: info?.owner ? [info.owner] : []
    }, { quoted: m })

  // Si el grupo ya está en la lista del bot
  if (info?.id && yaEstoy(info.id) && sub !== 'entrar')
    return conn.sendMessage(m.chat, {
      text: panel('✅ YA ESTOY EN ESE GRUPO', [
        `🏷️ *Grupo:* ${info.subject || info.id}`,
        `👥 *Miembros:* ${fmt(info.size || 0)}`,
        '',
        '💡 Si no aparezco, reinicia el bot con *' + usedPrefix + 'restart*.'
      ], sign())
    }, { quoted: m })

  // 2️⃣ Unirse
  try {
    let groupJid = null

    if (typeof conn.groupAcceptInvite === 'function')
      groupJid = await conn.groupAcceptInvite(code)

    if (!groupJid && typeof conn.groupAcceptInviteV4 === 'function' && info?.id)
      groupJid = await conn.groupAcceptInviteV4(conn.user?.id, { id: info.id, code })

    await m.react?.('✅').catch?.(() => {})

    const jid = groupJid || info?.id || ''
    const recien = panel('✅ ME UNÍ AL GRUPO', [
      `👤 *Pedido por:* ${displayName(m, conn)}`,
      `🏷️ *Grupo:* ${info?.subject || 'Nuevo grupo'}`,
      jid ? `🆔 *ID:* ${String(jid).split('@')[0]}` : null,
      info?.size ? `👥 *Miembros:* ${fmt(info.size)}` : null,
      '',
      '🐉 Ya estoy dentro, escríbanme para empezar.',
      `💡 Recuerda: *${usedPrefix}on admin* si quieres que respete ajustes de grupo.`,
      `⚡ ${BRAND} ⚡`
    ], '')

    await conn.sendMessage(m.chat, { text: recien }, { quoted: m })

    // Aviso dentro del grupo nuevo (best effort)
    if (jid)
      await conn.sendMessage(jid, {
        text: panel('🐉 GOKU BOT', [
          `📍 Acabo de unirme al grupo.`,
          `⚙️ Escríbanme *${usedPrefix}menu* para ver mis comandos.`,
          `🛡️ *${usedPrefix}on admin* activa el modo solo-admins.`,
          `⚡ ${BRAND} ⚡`
        ], '').replace(/\n+/g, '\n').trim()
      }).catch(() => {})

    return
  } catch (e) {
    const detalle = String(e?.message || e || 'error desconocido')
    const razones = {
      '401': 'El enlace venció o fue revocado.',
      '403': 'El bot está baneado de ese grupo.',
      '404': 'El enlace no existe.',
      '409': 'Ya estoy en ese grupo.',
      '410': 'El enlace expiró.',
      '500': 'El grupo está lleno.'
    }
    const codeMatch = detalle.match(/(4\d\d|5\d\d)/)
    const razon = codeMatch ? razones[codeMatch[1]] || detalle : detalle

    return conn.sendMessage(m.chat, {
      text: panel('❌ NO PUDE UNIRME', [
        `🔗 *Código:* ${code}`,
        `📌 *Motivo:* ${razon}`,
        '',
        '💡 Prueba otro enlace o pide que renueven la invitación.'
      ], sign())
    }, { quoted: m })
  }
}

handler.help = ['join <link>']
handler.tags = ['group']
handler.command = ['join', 'unirse', 'unir', 'entrar', 'joingrupo']

export default handler
