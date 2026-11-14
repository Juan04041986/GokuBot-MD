import {
  currency, fmt, panel, sign, parseAmount, getUser, targetJid, addMoney, displayName
} from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command, args }) => {
  const u = getUser(m.sender)
  if (!u) return

  const target = targetJid(m, args)
  const amountRaw = args.find(a => /^\d+%?$|^(all|todo)$/i.test(a))
  const amount = amountRaw ? parseAmount(amountRaw, u) : null

  if (!target || !amount)
    return conn.sendMessage(m.chat, {
      text: panel('💸 PAGAR', [
        '📍 Uso correcto:',
        `⧡ *${usedPrefix + command} 500 @usuario*`,
        `⧡ Respondiendo a un mensaje: *${usedPrefix + command} 500*`,
        '',
        `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`
      ], sign())
    }, { quoted: m })

  const targetNum = String(target).split('@')[0]
  if (target === m.sender || targetNum === String(m.sender).split('@')[0])
    return conn.sendMessage(m.chat, { text: panel('💸 PAGAR', ['🤡 No puedes pagarte a ti mismo.'], sign()) }, { quoted: m })

  if (amount < 1)
    return conn.sendMessage(m.chat, { text: panel('💸 PAGAR', ['📍 La cantidad debe ser mayor a 0.'], sign()) }, { quoted: m })

  if (amount > (Number(u.torucoin) || 0))
    return conn.sendMessage(m.chat, {
      text: panel('💸 PAGAR', [
        '💸 No tienes suficiente en la cartera.',
        '',
        `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`,
        `💡 Si tienes en el banco: *${usedPrefix}retirar ${amount}*`
      ], sign())
    }, { quoted: m })

  const v = getUser(target)
  if (!v) return

  addMoney(u, -amount)
  addMoney(v, amount)

  return conn.sendMessage(m.chat, {
    text: panel('💸 TRANSFERENCIA', [
      `📤 *De:* ${displayName(m, conn)}`,
      `📥 *Para:* @${targetNum}`,
      '',
      `🪙 *Monto:* ${fmt(amount)} ${currency()}`,
      '',
      `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`,
      `👛 *Su cartera:* ${fmt(v.torucoin)} ${currency()}`
    ], sign()),
    mentions: [target]
  }, { quoted: m })
}

handler.help = ['pagar <cantidad> @usuario']
handler.tags = ['economia']
handler.command = ['pagar', 'pay', 'transferir', 'regalarcoins']

export default handler
