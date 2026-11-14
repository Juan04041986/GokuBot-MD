import {
  currency, fmt, panel, sign, getUser, ITEMS, addItem, countItem, itemName, displayName
} from '../lib/economia.js'

const listShop = (u, usedPrefix, name) => {
  const rows = [`👤 *Usuario:* ${name}`, '']
  rows.push('*⚶ ARTÍCULOS EN VENTA:*')
  for (const [key, item] of Object.entries(ITEMS)) {
    rows.push(`${item.emoji} *${item.name}*`)
    rows.push(`    💵 ${fmt(item.price)} ${currency()} — ${item.desc}`)
    rows.push(`    🎒 Tienes: *${fmt(countItem(u, key))}* — Comprar: *${usedPrefix}comprar ${key}*`)
  }
  rows.push('', `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`)
  rows.push(`🎒 Ver tu mochila: *${usedPrefix}inventario*`)
  return panel('🛒 TIENDA DE GOKUBOT', rows, sign())
}

let handler = async (m, { conn, usedPrefix, command, args }) => {
  const u = getUser(m.sender)
  if (!u) return

  const action = ['inventario', 'inv', 'mochila', 'items'].includes(command) ? 'inventario' : 'tienda'

  if (action === 'inventario') {
    const rows = [`👤 *Usuario:* ${displayName(m, conn)}`, '', '*🎒 TU MOCHILA:*']
    let any = false
    for (const key of Object.keys(ITEMS)) {
      const n = countItem(u, key)
      if (!n) continue
      any = true
      rows.push(`${ITEMS[key].emoji} *${ITEMS[key].name}* x${fmt(n)}`)
    }
    if (!any) rows.push('📦 Está vacía... compra algo con *#tienda*.')
    rows.push('', `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`)
    return conn.sendMessage(m.chat, {
      text: panel('🎒 INVENTARIO', rows, sign())
    }, { quoted: m })
  }

  const itemKey = (args[0] || '').toLowerCase()
  const qty = Math.max(1, Math.min(20, parseInt(args[1]) || 1))

  if (!itemKey || !ITEMS[itemKey]) {
    return conn.sendMessage(m.chat, {
      text: listShop(u, usedPrefix, displayName(m, conn))
    }, { quoted: m })
  }

  const item = ITEMS[itemKey]
  const cost = item.price * qty

  if ((Number(u.torucoin) || 0) < cost)
    return conn.sendMessage(m.chat, {
      text: panel('🛒 TIENDA', [
        `💸 No te alcanza para *${item.name}* x${qty}`,
        `💵 *Costo:* ${fmt(cost)} ${currency()}`,
        `🪙 *Tu cartera:* ${fmt(u.torucoin)} ${currency()}`,
        '',
        '💡 Junta más con *#trabajar*, *#minar*, *#talar* o *#pescar*.'
      ], sign())
    }, { quoted: m })

  u.torucoin -= cost
  addItem(u, itemKey, qty)

  return conn.sendMessage(m.chat, {
    text: panel('🛒 COMPRA EXITOSA', [
      `👤 *Comprador:* ${displayName(m, conn)}`,
      '',
      `${item.emoji} *${itemName(itemKey)}* x${qty}`,
      `💵 *Pagado:* ${fmt(cost)} ${currency()}`,
      `🧾 *Descripción:* ${item.desc}`,
      '',
      `🎒 *Ahora tienes:* ${fmt(countItem(u, itemKey))}`,
      `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`,
      '',
      '⚶ El artículo se usa automáticamente en su comando.'
    ], sign())
  }, { quoted: m })
}

handler.help = ['tienda', 'comprar <item>', 'inventario']
handler.tags = ['economia']
handler.command = ['tienda', 'shop', 'comprar', 'buy', 'inventario', 'inv', 'mochila']

export default handler
