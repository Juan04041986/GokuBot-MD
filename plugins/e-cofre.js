import {
  MS, currency, fmt, panel, sign, pick, randInt, pickWeighted, cooldown, human,
  getUser, waitPanel, countItem, useItem, addItem, addMoney
} from '../lib/economia.js'

const RARITY = {
  comun: { label: '⚪ COMÚN', w: 48 },
  raro: { label: '🔵 RARO', w: 26 },
  epico: { label: '🟣 ÉPICO', w: 15 },
  legendario: { label: '🟡 LEGENDARIO', w: 8 },
  mitico: { label: '🔴 MÍTICO', w: 3 }
}

const LOOT = {
  comun: [
    { w: 3, text: '🪙 Unas monedas sueltas', coins: [150, 350] },
    { w: 3, text: '🔖 Un montón de ticks olvidados', coins: [100, 250], ticks: [10, 25] },
    { w: 2, text: '🧦 Solo un calcetín usado... qué asco', coins: [0, 40] }
  ],
  raro: [
    { w: 3, text: '🎒 Una mochila con provisiones', coins: [400, 700], ticks: [10, 25] },
    { w: 2, text: '🛠️ Herramientas de entrenamiento', coins: [350, 600], inv: { pico: 1 } },
    { w: 2, text: '🛡️ Un *Escudo de Ki* en buen estado', coins: [250, 450], inv: { escudo: 1 } }
  ],
  epico: [
    { w: 3, text: '💎 Una gema que venderás carísima', coins: [900, 1500], ticks: [20, 40] },
    { w: 2, text: '🎣 Una *Caña Maestra* dorada', coins: [700, 1200], inv: { cana: 1 } },
    { w: 2, text: '🔫 Un *Rifle Kame* de importación', coins: [700, 1200], inv: { rifle: 1 } }
  ],
  legendario: [
    { w: 3, text: '🐉 Una bendición del Dragón Shenron', coins: [2000, 3200], ticks: [40, 80] },
    { w: 2, text: '🔱 El arma de un guerrero legendario', coins: [1500, 2500], inv: { hacha: 1 }, ticks: [30, 60] }
  ],
  mitico: [
    { w: 2, text: '🌟 ¡EL PREMIO DEL TORNEO DE ARTES MARCIALES!', coins: [4000, 6000], ticks: [80, 150] },
    { w: 1, text: '🌍 Un *Cofre del Dragón* intacto con 7 estrellas', coins: [3000, 5000], inv: { cofre: 1, escudo: 1 }, ticks: [60, 120] }
  ]
}

const rollRarity = () => {
  const roll = Math.random() * 100
  if (roll < 48) return 'comun'
  if (roll < 74) return 'raro'
  if (roll < 89) return 'epico'
  if (roll < 97) return 'legendario'
  return 'mitico'
}

let handler = async (m, { conn, usedPrefix, command }) => {
  const u = getUser(m.sender)
  if (!u) return

  const inStock = countItem(u, 'cofre') > 0
  if (inStock) {
    useItem(u, 'cofre')
  } else {
    const cd = cooldown(u, 'cofre', 3 * MS.h)
    if (!cd.ok) {
      return conn.sendMessage(m.chat, {
        text: waitPanel(u, 'COFRE', cd.left, `Puedes comprar uno cuando quieras con *${usedPrefix}comprar cofre*.`)
      }, { quoted: m })
    }
  }

  const rarity = rollRarity()
  const reward = pickWeighted(LOOT[rarity])
  const coins = randInt(...(reward.coins || [0, 0]))
  const ticks = randInt(...(reward.ticks || [0, 0]))

  addMoney(u, coins)
  u.toruexp += ticks
  const extras = []
  if (reward.inv)
    for (const [k, v] of Object.entries(reward.inv)) {
      addItem(u, k, v)
      extras.push(`🎁 Objeto: *${k}* x${v}`)
    }

  return conn.sendMessage(m.chat, {
    text: panel('🎁 COFRE', [
      `👤 *Usuario:* @${String(m.sender).split('@')[0]}`,
      `🏷️ *Rareza:* ${RARITY[rarity].label}`,
      `🔓 *Fuente:* ${inStock ? 'Cofre comprado' : 'Cofre gratis (cada 3h)'}`,
      '',
      pick([
        '🥁 Abres la tapa lentamente...',
        '✨ El cofre brilla con una luz dorada...',
        '🎲 Giras la llave y la cerradura cede...',
        '🐉 El sello del dragón se rompe...'
      ]),
      reward.text,
      '',
      coins > 0 ? `🪙 *Ganancia:* +${fmt(coins)} ${currency()}` : null,
      ticks > 0 ? `🔖 *Ticks:* +${fmt(ticks)}` : null,
      ...extras,
      '',
      `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`,
      `🎒 *Cofres guardados:* ${fmt(countItem(u, 'cofre'))}`,
      inStock ? null : `⏳ *Próximo gratis:* en ${human(3 * MS.h)}`
    ], sign()),
    mentions: [m.sender]
  }, { quoted: m })
}

handler.help = ['cofre']
handler.tags = ['economia']
handler.command = ['cofre', 'chest', 'caja', 'abrircofre']

export default handler
