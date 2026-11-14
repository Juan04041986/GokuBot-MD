import {
  currency, fmt, panel, sign, getUser, walletRows, total, human, MS, canUse
} from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix }) => {
  const u = getUser(m.sender)
  if (!u) return

  const users = global.db?.data?.users || {}
  const ranking = Object.entries(users)
    .map(([jid, x]) => ({ jid, total: (Number(x?.torucoin) || 0) + (Number(x?.bank) || 0) }))
    .sort((a, b) => b.total - a.total)
  const position = ranking.findIndex(x => x.jid === m.sender) + 1

  const daily = canUse(u, 'diario', 24 * MS.h)
  const cofre = canUse(u, 'cofre', 3 * MS.h)
  const trabajar = canUse(u, 'trabajar', 30 * MS.m)

  const rows = [
    ...walletRows(u, `@${String(m.sender).split('@')[0]}`),
    '',
    '*📊 ESTADO:*',
    `🏆 *Posición:* ${position > 0 ? `#${position}` : 'sin ranking'} de ${fmt(ranking.length)}`,
    `🎁 *Diario:* ${daily.ok ? '✅ listo' : `⏳ ${human(daily.left)}`}`,
    `🎒 *Cofre gratis:* ${cofre.ok ? '✅ listo' : `⏳ ${human(cofre.left)}`}`,
    `💼 *Trabajo:* ${trabajar.ok ? '✅ listo' : `⏳ ${human(trabajar.left)}`}`,
    '',
    '*⚶ ACCIONES RÁPIDAS:*',
    `⧡ ${usedPrefix}daily — reclamar recompensa`,
    `⧡ ${usedPrefix}trabajar — ganar monedas`,
    `⧡ ${usedPrefix}tienda — comprar mejoras`,
    `⧡ ${usedPrefix}eco — ver todos los comandos`
  ]

  return conn.sendMessage(m.chat, {
    text: panel('🪙 MI CARTERA', rows, sign()),
    mentions: [m.sender]
  }, { quoted: m })
}

handler.help = ['coins']
handler.tags = ['economia']
handler.command = ['coins', 'cartera', 'bal', 'balance', 'dinero', 'wallet', 'micoins']

export default handler
