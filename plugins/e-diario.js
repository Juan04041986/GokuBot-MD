import {
  MS, currency, fmt, panel, sign, randInt, human, getUser, canUse, waitPanel, addItem, ITEMS
} from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix, command }) => {
  const u = getUser(m.sender)
  if (!u) return

  const now = Date.now()
  const cd = canUse(u, 'diario', 24 * MS.h)

  if (!cd.ok) {
    return conn.sendMessage(m.chat, {
      text: waitPanel(u, 'DIARIO', cd.left, `Racha actual: *${u.eco.streak.daily} día(s)* 🔥`)
    }, { quoted: m })
  }

  const last = Number(u.eco.streak.last) || 0
  const keepStreak = last && now - last < 48 * MS.h
  const streak = keepStreak ? (Number(u.eco.streak.daily) || 0) + 1 : 1

  const base = 400
  const bonusStreak = Math.min(streak, 10) * 120
  const bonusLuck = randInt(0, 350)
  const coins = base + bonusStreak + bonusLuck
  const ticks = randInt(10, 30) + Math.min(streak, 10) * 5

  u.eco.cd.diario = now
  u.eco.streak.daily = streak
  u.eco.streak.last = now
  u.torucoin += coins
  u.toruexp += ticks

  const extras = []
  if (streak > 0 && streak % 7 === 0) {
    addItem(u, 'cofre', 1)
    extras.push(`🎁 *Bonus de racha (${streak} días):* ${ITEMS.cofre.emoji} Cofre del Dragón x1`)
  }
  if (streak >= 30) extras.push('👑 ¡Racha legendaria! Eres un verdadero guerrero Z.')

  return conn.sendMessage(m.chat, {
    text: panel('🎁 RECOMPENSA DIARIA', [
      `👤 *Usuario:* @${String(m.sender).split('@')[0]}`,
      `🔥 *Racha:* ${streak} día(s) ${keepStreak ? '(se mantiene)' : '(reiniciada)'}`,
      '',
      '🐉 Shenron escuchó tu llamado...',
      '',
      `🪙 *Base:* ${fmt(base)} ${currency()}`,
      `🔥 *Bonus racha:* +${fmt(bonusStreak)}`,
      `🍀 *Bonus suerte:* +${fmt(bonusLuck)}`,
      `🔖 *Ticks:* +${fmt(ticks)}`,
      ...extras,
      '',
      `🪙 *Total ganado:* +${fmt(coins)} ${currency()}`,
      `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`,
      `⏳ *Próximo diario:* en ${human(24 * MS.h)}`
    ], sign()),
    mentions: [m.sender]
  }, { quoted: m })
}

handler.help = ['diario']
handler.tags = ['economia']
handler.command = ['diario', 'daily', 'reclamar', 'diariocoins']

export default handler
