import {
  currency, fmt, panel, sign, parseAmount, getUser, isGroupEnabled, disabledPanel, addMoney, displayName
} from '../lib/economia.js'

const DICE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

let handler = async (m, { conn, usedPrefix, command, args }) => {
  if (!isGroupEnabled(m, 'fJuegos'))
    return conn.sendMessage(m.chat, { text: disabledPanel(usedPrefix, 'juegos') }, { quoted: m })

  const u = getUser(m.sender)
  if (!u) return

  const game = ['dados', 'dice'].includes(command) ? 'dados'
    : ['ruleta', 'roulette'].includes(command) ? 'ruleta'
      : ['coinflip', 'cara'].includes(command) ? 'cara'
        : 'auto'

  const bet = parseAmount(args[0], u)
  const option = (args[1] || '').toLowerCase()

  const help = panel('🎲 APOSTAR', [
    `📍 Apostar: *${usedPrefix + command} <cantidad> <opción>*`,
    '',
    '🎯 *Juegos disponibles:*',
    `⧡ Dados (x2): *${usedPrefix}apostar 100 par* o *impar*`,
    `⧡ Dado exacto (x6): *${usedPrefix}dados 100 4*`,
    `⧡ Cara o cruz (x2): *${usedPrefix}coinflip 100 cara*`,
    `⧡ Ruleta (x2 / verde x14): *${usedPrefix}ruleta 100 rojo*`,
    '',
    `💰 *Mínimo:* ${fmt(50)} ${currency()}`,
    `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`
  ], sign())

  if (!bet) return conn.sendMessage(m.chat, { text: help }, { quoted: m })

  if (bet < 50)
    return conn.sendMessage(m.chat, { text: panel('🎲 APOSTAR', [`📍 La apuesta mínima es *${fmt(50)} ${currency()}*.`], sign()) }, { quoted: m })

  if ((Number(u.torucoin) || 0) < bet)
    return conn.sendMessage(m.chat, {
      text: panel('🎲 APOSTAR', [
        `💸 No tienes suficiente ${currency()}.`,
        `🪙 *Cartera:* ${fmt(u.torucoin)}`,
        `💡 Prueba *${usedPrefix}trabajar* para juntar monedas.`
      ], sign())
    }, { quoted: m })

  let result = null
  let win = false
  let mult = 2
  let detail = ''

  if (game === 'dados' || (game === 'auto' && ['par', 'impar', '1', '2', '3', '4', '5', '6'].includes(option))) {
    const d1 = Math.ceil(Math.random() * 6)
    const d2 = Math.ceil(Math.random() * 6)
    const sum = d1 + d2
    detail = `🎲 *Dados:* ${DICE[d1 - 1]} ${DICE[d2 - 1]} → *${sum}*`

    if (['par', 'impar'].includes(option) || (game === 'dados' && !option)) {
      const guess = ['par', 'impar'].includes(option) ? option : 'par'
      win = guess === 'par' ? sum % 2 === 0 : sum % 2 !== 0
      mult = 2
      detail += `\n🎯 *Tu apuesta:* ${guess}`
    } else if (/^[1-6]$/.test(option)) {
      win = sum === Number(option)
      mult = 6
      detail += `\n🎯 *Tu apuesta:* exactamente ${option}`
    } else {
      return conn.sendMessage(m.chat, { text: help }, { quoted: m })
    }
    result = win ? '🎉 ¡Ganaste la tirada!' : '💀 Perdiste la tirada.'
  } else if (game === 'cara' || (game === 'auto' && ['cara', 'cruz', 'sello'].includes(option))) {
    const flip = Math.random() < 0.5 ? 'cara' : 'cruz'
    const guess = option === 'sello' ? 'cruz' : option || 'cara'
    win = guess === flip
    mult = 2
    detail = `🪙 *Moneda:* salió *${flip.toUpperCase()}*\n🎯 *Tu apuesta:* ${guess}`
    result = win ? '🎉 ¡Acertaste!' : '💀 No acertaste.'
  } else if (game === 'ruleta' || (game === 'auto' && ['rojo', 'negro', 'verde'].includes(option))) {
    const num = Math.floor(Math.random() * 37)
    const color = num === 0 ? 'verde' : num % 2 === 0 ? 'negro' : 'rojo'
    const guess = ['rojo', 'negro', 'verde'].includes(option) ? option : 'rojo'
    win = guess === color
    mult = color === 'verde' ? 14 : 2
    detail = `🎡 *Ruleta:* salió *${num} ${color.toUpperCase()}*\n🎯 *Tu apuesta:* ${guess}`
    result = win ? '🎉 ¡La ruleta te sonrió!' : '💀 La casa se quedó con todo.'
  } else {
    return conn.sendMessage(m.chat, { text: help }, { quoted: m })
  }

  const profit = win ? bet * mult - bet : -bet
  addMoney(u, profit)

  return conn.sendMessage(m.chat, {
    text: panel('🎲 APOSTAR', [
      `👤 *Usuario:* ${displayName(m, conn)}`,
      '',
      detail,
      '',
      result,
      '',
      `💵 *Apuesta:* ${fmt(bet)} ${currency()}`,
      win ? `🪙 *Ganancia:* +${fmt(bet * mult)} ${currency()} (x${mult})` : `💸 *Pérdida:* ${fmt(bet)} ${currency()}`,
      '',
      `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`
    ], sign())
  }, { quoted: m })
}

handler.help = ['apostar <cantidad> <opción>']
handler.tags = ['economia']
handler.command = ['apostar', 'bet', 'dados', 'dice', 'coinflip', 'ruleta', 'roulette']

export default handler
