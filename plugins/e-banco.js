import {
  currency, fmt, panel, sign, parseAmount, getUser, walletRows, total
} from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command, args }) => {
  const u = getUser(m.sender)
  if (!u) return

  const action = ['depositar', 'dep', 'deposito'].includes(command) ? 'depositar'
    : ['retirar', 'ret', 'sacar', 'withdraw'].includes(command) ? 'retirar'
      : (args[0] || '').toLowerCase()

  if (['depositar', 'dep', 'deposito'].includes(action)) {
    const amount = parseAmount(args[0], u)
    if (!amount || amount <= 0)
      return conn.sendMessage(m.chat, {
        text: panel('🏦 BANCO', [
          `📍 Indica cuánto depositar: *${usedPrefix + command} 500*`,
          `💡 También puedes usar *${usedPrefix + command} all*`,
          '',
          ...walletRows(u)
        ], sign())
      }, { quoted: m })

    if (amount > (Number(u.torucoin) || 0))
      return conn.sendMessage(m.chat, {
        text: panel('🏦 BANCO', [
          '💸 No tienes esa cantidad en la cartera.',
          '',
          ...walletRows(u)
        ], sign())
      }, { quoted: m })

    u.torucoin -= amount
    u.bank += amount
    return conn.sendMessage(m.chat, {
      text: panel('🏦 DEPÓSITO', [
        `📥 Depositado: *+${fmt(amount)} ${currency()}*`,
        '',
        ...walletRows(u),
        '',
        '🛡️ Tu dinero en el banco está protegido de los ladrones.'
      ], sign())
    }, { quoted: m })
  }

  if (['retirar', 'ret', 'sacar', 'withdraw'].includes(action)) {
    const amount = parseAmount(args[0], u)
    if (!amount || amount <= 0)
      return conn.sendMessage(m.chat, {
        text: panel('🏦 BANCO', [
          `📍 Indica cuánto retirar: *${usedPrefix + command} 500*`,
          `💡 También puedes usar *${usedPrefix + command} all*`,
          '',
          ...walletRows(u)
        ], sign())
      }, { quoted: m })

    if (amount > (Number(u.bank) || 0))
      return conn.sendMessage(m.chat, {
        text: panel('🏦 BANCO', ['💸 No tienes esa cantidad en el banco.', '', ...walletRows(u)], sign())
      }, { quoted: m })

    u.bank -= amount
    u.torucoin += amount
    return conn.sendMessage(m.chat, {
      text: panel('🏦 RETIRO', [
        `📤 Retirado: *-${fmt(amount)} ${currency()}*`,
        '',
        ...walletRows(u),
        '',
        '⚠️ Ojo: el dinero en la cartera sí puede ser robado.'
      ], sign())
    }, { quoted: m })
  }

  return conn.sendMessage(m.chat, {
    text: panel('🏦 BANCO DE GOKUBOT', [
      `👤 *Usuario:* @${String(m.sender).split('@')[0]}`,
      '',
      `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`,
      `🏦 *Banco:* ${fmt(u.bank)} ${currency()}`,
      `💰 *Patrimonio:* ${fmt(total(u))} ${currency()}`,
      '',
      '*⚶ Comandos:*',
      `⧡ ${usedPrefix}depositar <cantidad|all>`,
      `⧡ ${usedPrefix}retirar <cantidad|all>`,
      `⧡ ${usedPrefix}coins para ver tu cartera`,
      '',
      '🛡️ El banco protege tu dinero de los robos.'
    ], sign()),
    mentions: [m.sender]
  }, { quoted: m })
}

handler.help = ['banco', 'depositar <cantidad>', 'retirar <cantidad>']
handler.tags = ['economia']
handler.command = ['banco', 'bank', 'depositar', 'dep', 'deposito', 'retirar', 'ret', 'sacar', 'withdraw']

export default handler
