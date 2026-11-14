import {
  MS, currency, fmt, panel, sign, pick, randInt, chance, cooldown, human,
  getUser, waitPanel, isGroupEnabled, disabledPanel, targetJid, countItem, useItem, addMoney
} from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command, args }) => {
  if (!isGroupEnabled(m, 'fJuegos'))
    return conn.sendMessage(m.chat, { text: disabledPanel(usedPrefix, 'juegos') }, { quoted: m })

  const u = getUser(m.sender)
  if (!u) return

  const victim = targetJid(m, args)
  const self = String(m.sender).split('@')[0]

  if (!victim)
    return conn.sendMessage(m.chat, {
      text: panel('🕶️ ROBAR', [
        '📍 Debes indicar a quién quieres robar.',
        '',
        `⚶ Ejemplos:`,
        `⧡ *${usedPrefix + command}* @usuario`,
        `⧡ Responde a su mensaje con *${usedPrefix + command}*`
      ], sign())
    }, { quoted: m })

  const victimNum = String(victim).split('@')[0]
  const botJid = conn.user?.jid || conn.user?.id || ''
  if (victim === m.sender || victimNum === self)
    return conn.sendMessage(m.chat, { text: panel('🕶️ ROBAR', ['🤡 No puedes robarte a ti mismo...'], sign()) }, { quoted: m })

  if (botJid && (victim === botJid || victimNum === String(botJid).split('@')[0]))
    return conn.sendMessage(m.chat, { text: panel('🕶️ ROBAR', ['🐉 ¿Robarle al propio *GokuBot*? Ni lo intentes.'], sign()) }, { quoted: m })

  const cd = cooldown(u, 'robar', 8 * MS.m)
  if (!cd.ok) return conn.sendMessage(m.chat, { text: waitPanel(u, '🕶️ ROBAR', cd.left, 'Busca otra víctima más tarde 😈') }, { quoted: m })

  const v = getUser(victim)
  if (!v) return

  if ((Number(v.torucoin) || 0) < 200)
    return conn.sendMessage(m.chat, {
      text: panel('🕶️ ROBAR', [
        `👤 *Objetivo:* @${victimNum}`,
        `🪙 *Cartera:* ${fmt(v.torucoin)} ${currency()}`,
        '',
        '💤 Está más seco que el Desierto del Diablo, busca a otro.'
      ], sign()),
      mentions: [victim]
    }, { quoted: m })

  if (countItem(v, 'escudo') > 0) {
    useItem(v, 'escudo')
    addMoney(u, -300)
    return conn.sendMessage(m.chat, {
      text: panel('🛡️ ROBO FALLIDO', [
        `👤 *Objetivo:* @${victimNum}`,
        '',
        '🛡️ Tenía un *Escudo de Ki* y bloqueó tu robo.',
        `💸 Multa por intento: *${fmt(300)} ${currency()}*`,
        '',
        `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`
      ], sign()),
      mentions: [victim]
    }, { quoted: m })
  }

  const success = chance(62)
  const wallet = Number(v.torucoin) || 0

  if (success) {
    const stolen = Math.min(2500, Math.max(150, Math.floor(wallet * (randInt(10, 35) / 100))))
    v.torucoin = Math.max(0, wallet - stolen)
    addMoney(u, stolen)
    return conn.sendMessage(m.chat, {
      text: panel('🕶️ ROBO EXITOSO', [
        `👤 *Víctima:* @${victimNum}`,
        '',
        pick([
          '🏃 Le arrebataste la cartera y corriste como Vegeta en su primera pelea.',
          '🧤 Le sacaste las monedas del bolsillo sin que se diera cuenta.',
          '🚪 Entraste por la ventana y saliste por la puerta trasera.',
          '🎭 Te disfrazaste de repartidor y te abrió la puerta.'
        ]),
        '',
        `🪙 *Robaste:* +${fmt(stolen)} ${currency()}`,
        `👛 *Le queda:* ${fmt(v.torucoin)} ${currency()}`,
        `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`
      ], sign()),
      mentions: [victim]
    }, { quoted: m })
  }

  const fine = Math.min(600, Math.max(100, Math.floor((Number(u.torucoin) || 0) * 0.15)))
  addMoney(u, -fine)
  addMoney(v, fine)
  return conn.sendMessage(m.chat, {
    text: panel('🚨 ROBO FALLIDO', [
      `👤 *Víctima:* @${victimNum}`,
      '',
      pick([
        '🚔 Te agarró la policía antes de salir del callejón.',
        '🥊 La víctima resultó ser cinturón negro y te dio una paliza.',
        '🐕 Un perro te mordió la pierna y tuviste que huir.',
        '📹 Te grabó una cámara y tuviste que pagar para que no lo suba.'
      ]),
      '',
      `💸 *Indemnización:* ${fmt(fine)} ${currency()} a @${victimNum}`,
      `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`,
      `⏳ *Espera:* ${human(8 * MS.m)}`
    ], sign()),
    mentions: [victim]
  }, { quoted: m })
}

handler.help = ['robar @usuario']
handler.tags = ['economia']
handler.command = ['robar', 'rob', 'asaltar', 'steal']

export default handler
