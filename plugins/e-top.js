import { currency, fmt, short, panel, sign, bar } from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix }) => {
  const users = global.db?.data?.users || {}
  const list = Object.entries(users)
    .map(([jid, u]) => ({
      jid,
      name: u?.name || jid.split('@')[0],
      wallet: Number(u?.torucoin) || 0,
      bank: Number(u?.bank) || 0,
      get total() { return this.wallet + this.bank }
    }))
    .filter(u => u.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 10)

  if (!list.length)
    return conn.sendMessage(m.chat, {
      text: panel('🏆 TOP RICOS', ['📍 Todavía nadie tiene monedas.', `💡 Sé el primero con *${usedPrefix}trabajar*.`], sign())
    }, { quoted: m })

  const medals = ['🥇', '🥈', '🥉']
  const top = list[0].total

  const rows = [
    '*🏆 LOS MÁS RICOS DE GOKUBOT*',
    ''
  ]

  list.forEach((u, i) => {
    const num = u.jid.split('@')[0]
    rows.push(`${medals[i] || `${i + 1}.`} @${num} — *${fmt(u.total)}* ${currency()}`)
    rows.push(`    🪙 ${short(u.wallet)} • 🏦 ${short(u.bank)}  ${bar((u.total / top) * 100, 8)}`)
  })

  rows.push('', `📊 *Usuarios con dinero:* ${Object.values(users).filter(u => (Number(u?.torucoin) || 0) + (Number(u?.bank) || 0) > 0).length}`)

  return conn.sendMessage(m.chat, {
    text: panel('🏆 TOP RICOS', rows, sign()),
    mentions: list.map(u => u.jid)
  }, { quoted: m })
}

handler.help = ['topcoins']
handler.tags = ['economia']
handler.command = ['topcoins', 'toprico', 'topricos', 'topeco', 'ricos', 'rankingcoins']

export default handler
