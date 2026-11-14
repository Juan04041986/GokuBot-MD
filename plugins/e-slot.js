import {
  currency, fmt, panel, sign, parseAmount, getUser, isGroupEnabled, disabledPanel, addMoney, displayName
} from '../lib/economia.js'

const SYMBOLS = ['🍒', '🍋', '🍇', '🔔', '⭐', '7️⃣', '💎']
const MULT = { '🍒': 3, '🍋': 3.5, '🍇': 4, '🔔': 5, '⭐': 6, '7️⃣': 10, '💎': 15 }

const delay = ms => new Promise(r => setTimeout(r, ms))

let handler = async (m, { conn, usedPrefix, command, args }) => {
  if (!isGroupEnabled(m, 'fJuegos'))
    return conn.sendMessage(m.chat, { text: disabledPanel(usedPrefix, 'juegos') }, { quoted: m })

  const u = getUser(m.sender)
  if (!u) return

  const bet = parseAmount(args[0], u)
  const min = 50
  const max = 100000

  if (!bet)
    return conn.sendMessage(m.chat, {
      text: panel('🎰 TRAGAPERRAS', [
        `📍 Indica tu apuesta: *${usedPrefix + command} 100*`,
        '',
        `🎰 *Símbolos:* ${SYMBOLS.join(' ')}`,
        `💰 *Apuesta mínima:* ${fmt(min)} ${currency()}`,
        `💰 *Apuesta máxima:* ${fmt(max)} ${currency()}`,
        `⚶ Ejemplo: *${usedPrefix + command} 500*`,
        '',
        `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`
      ], sign())
    }, { quoted: m })

  if (bet < min || bet > max)
    return conn.sendMessage(m.chat, {
      text: panel('🎰 TRAGAPERRAS', [`📍 La apuesta debe estar entre *${fmt(min)}* y *${fmt(max)} ${currency()}*.`], sign())
    }, { quoted: m })

  if ((Number(u.torucoin) || 0) < bet)
    return conn.sendMessage(m.chat, {
      text: panel('🎰 TRAGAPERRAS', [
        `💸 No tienes suficiente ${currency()}.`,
        `🪙 *Cartera:* ${fmt(u.torucoin)}`,
        `💡 Trabaja con *${usedPrefix}trabajar* o *${usedPrefix}minar*.`
      ], sign())
    }, { quoted: m })

  const sent = await conn.sendMessage(m.chat, {
    text: panel('🎰 TRAGAPERRAS', [
      '┃ 🍒 ┃ 🍋 ┃ 🍇 ┃',
      '',
      '⏳ Girando los rodillos...'
    ], sign())
  }, { quoted: m })

  await delay(1200)

  const reels = [SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)], SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]]
  const [a, b, c] = reels
  const line = `┃ ${a} ┃ ${b} ┃ ${c} ┃`

  let profit = -bet
  let result
  if (a === b && b === c) {
    const gain = Math.round(bet * MULT[a])
    profit = gain - bet
    result = `🎉 ¡¡JACKPOT!! Tres *${a}* iguales.`
  } else if (a === b || a === c || b === c) {
    const gain = Math.round(bet * 1.4)
    profit = gain - bet
    result = '😮 Dos iguales, recuperas algo.'
  } else {
    result = '💀 No coincidió nada... la casa gana.'
  }

  addMoney(u, profit)

  const text = panel('🎰 TRAGAPERRAS', [
    `👤 *Usuario:* ${displayName(m, conn)}`,
    line,
    '',
    result,
    '',
    `💵 *Apuesta:* ${fmt(bet)} ${currency()}`,
    profit >= 0 ? `🪙 *Ganancia:* +${fmt(profit + bet)} ${currency()}` : `💸 *Pérdida:* ${fmt(bet)} ${currency()}`,
    `📊 *Balance:* ${profit >= 0 ? '+' : ''}${fmt(profit)} ${currency()}`,
    '',
    `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`
  ], sign())

  try {
    await conn.sendMessage(m.chat, { text, edit: sent.key })
  } catch {
    await conn.sendMessage(m.chat, { text }, { quoted: m })
  }
}

handler.help = ['slot <apuesta>']
handler.tags = ['economia']
handler.command = ['slot', 'slots', 'tragaperras']

export default handler
