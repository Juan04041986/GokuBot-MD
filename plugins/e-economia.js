import {
  currency, fmt, panel, sign, getUser, total, human, MS, canUse, countItem, ITEMS, displayName
} from '../lib/economia.js'

let handler = async (m, { conn, usedPrefix }) => {
  const u = getUser(m.sender)
  if (!u) return

  const p = usedPrefix
  const daily = canUse(u, 'diario', 24 * MS.h)
  const cofre = canUse(u, 'cofre', 3 * MS.h)
  const trabajar = canUse(u, 'trabajar', 30 * MS.m)
  const minar = canUse(u, 'minar', 5 * MS.m)

  const header = panel('🪙 ECONOMÍA', [
    `👤 *Usuario:* ${displayName(m, conn)}`,
    `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`,
    `🏦 *Banco:* ${fmt(u.bank)} ${currency()}`,
    `💰 *Patrimonio:* ${fmt(total(u))} ${currency()}`,
    '',
    `🎁 Diario: ${daily.ok ? '✅' : `⏳ ${human(daily.left)}`}  •  🎒 Cofre: ${cofre.ok ? '✅' : `⏳ ${human(cofre.left)}`}`,
    `💼 Trabajo: ${trabajar.ok ? '✅' : `⏳ ${human(trabajar.left)}`}  •  ⛏️ Mina: ${minar.ok ? '✅' : `⏳ ${human(minar.left)}`}`
  ], sign())

  const trabajos = panel('💼 TRABAJOS', [
    `⧡ ${p}trabajar — sueldo cada 30 min`,
    `⧡ ${p}minar — piedras, oro y diamantes`,
    `⧡ ${p}talar — madera y árboles sagrados`,
    `⧡ ${p}pescar — peces y dragones de agua`,
    `⧡ ${p}cazar — animales y criaturas raras`,
    `⧡ ${p}slut — trabajo nocturno (paga bien)`,
    `⧡ ${p}crimen — riesgo alto, recompensa alta`
  ], sign())

  const banca = panel('🏦 BANCA', [
    `⧡ ${p}coins — ver tu cartera`,
    `⧡ ${p}banco — estado del banco`,
    `⧡ ${p}depositar <cant|all> — proteger dinero`,
    `⧡ ${p}retirar <cant|all> — sacar del banco`,
    `⧡ ${p}pagar <cant> @user — transferir`,
    `⧡ ${p}topcoins — ranking de ricos`
  ], sign())

  const suerte = panel('🎲 SUERTE Y EXTRAS', [
    `⧡ ${p}diario — recompensa cada 24h`,
    `⧡ ${p}cofre — cofre gratis cada 3h`,
    `⧡ ${p}slot <apuesta> — tragamonedas`,
    `⧡ ${p}apostar <cant> <opción> — dados/cara`,
    `⧡ ${p}ruleta <cant> <color> — ruleta`,
    `⧡ ${p}robar @user — robar cartera (con riesgo)`,
    `⧡ ${p}tienda / ${p}comprar — mejoras`,
    `⧡ ${p}inventario — tus objetos (${fmt(Object.keys(ITEMS).reduce((a, k) => a + countItem(u, k), 0))})`
  ], sign())

  return conn.sendMessage(m.chat, {
    text: [header, trabajos, banca, suerte].join('\n\n')
  }, { quoted: m })
}

handler.help = ['economia']
handler.tags = ['economia']
handler.command = ['economia', 'eco', 'menueco', 'menueconomia', 'economía']

export default handler
