/**
 * 🐉 GokuBot - Sistema de economía
 * Utilidades compartidas por los comandos de la categoría ECONOMÍA.
 */

export const MS = { s: 1000, m: 60000, h: 3600000, d: 86400000 }

export const currency = () => global.currency || 'GokuCoins'

export const BRAND = '𝐏𝐮𝐧𝐢𝐬𝐡𝐞𝐫 𝐃𝐞𝐯'

/** Firma que aparece al pie de todos los comandos de economía */
export const sign = () => `> ⚡ ${global.brandEco || BRAND} ⚡`

/** Número con separador de miles: 1234567 -> 1.234.567 */
export function fmt(n) {
  const v = Math.floor(Number(n) || 0)
  const s = String(Math.abs(v)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (v < 0 ? '-' : '') + s
}

/** Número corto para rankings: 1530 -> 1.5k */
export function short(n) {
  const v = Math.floor(Number(n) || 0)
  if (v >= 1000000) return (v / 1000000).toFixed(1).replace('.0', '') + 'M'
  if (v >= 1000) return (v / 1000).toFixed(1).replace('.0', '') + 'k'
  return String(v)
}

export function bar(pct, size = 10) {
  const p = Math.max(0, Math.min(100, Number(pct) || 0))
  const full = Math.round((p / 100) * size)
  return '▰'.repeat(full) + '▱'.repeat(Math.max(0, size - full))
}

/** Panel con el estilo visual del bot */
export function panel(title, rows = [], footer = '') {
  const body = rows
    .filter(r => r !== undefined && r !== null && r !== '')
    .map(r => `│ ${r}`)
    .join('\n')
  return [`*╭─「 ${title} 」*`, body, '*╰────────────*', footer].filter(Boolean).join('\n')
}

export const pick = list => list[Math.floor(Math.random() * list.length)]

export const randInt = (min = 0, max = 0) => {
  const a = Math.ceil(Math.min(min, max))
  const b = Math.floor(Math.max(min, max))
  return Math.floor(Math.random() * (b - a + 1)) + a
}

export const chance = pct => Math.random() * 100 < Number(pct || 0)

export function pickWeighted(list = []) {
  const total = list.reduce((acc, i) => acc + (Number(i.w) || 1), 0)
  let roll = Math.random() * total
  for (const item of list) {
    roll -= Number(item.w) || 1
    if (roll <= 0) return item
  }
  return list[list.length - 1]
}

export function human(ms) {
  const t = Math.max(0, Math.ceil(Number(ms) / 1000))
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

/** Normaliza los campos de economía del usuario */
export function ensure(u) {
  if (!u || typeof u !== 'object') return u
  for (const k of ['torucoin', 'bank', 'bankk', 'toruexp', 'coin', 'exp', 'level'])
    if (!Number.isFinite(u[k])) u[k] = 0
  if (!u.eco || typeof u.eco !== 'object') u.eco = {}
  if (!u.eco.cd || typeof u.eco.cd !== 'object') u.eco.cd = {}
  if (!u.eco.stats || typeof u.eco.stats !== 'object') u.eco.stats = {}
  if (!u.eco.streak || typeof u.eco.streak !== 'object') u.eco.streak = { daily: 0, last: 0 }
  if (!u.inv || typeof u.inv !== 'object') u.inv = {}
  return u
}

export function getUser(jid) {
  if (!global.db?.data) return null
  if (!global.db.data.users || typeof global.db.data.users !== 'object') global.db.data.users = {}
  if (!global.db.data.users[jid] || typeof global.db.data.users[jid] !== 'object') global.db.data.users[jid] = {}
  return ensure(global.db.data.users[jid])
}

export const total = u => (Number(u.torucoin) || 0) + (Number(u.bank) || 0)

export function walletRows(u, name = '') {
  const pct = Math.round((Math.max(0, Number(u.exp) || 0) % 1000) / 10)
  return [
    name ? `👤 *Usuario:* ${name}` : null,
    `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`,
    `🏦 *Banco:* ${fmt(u.bank)} ${currency()}`,
    `💰 *Total:* ${fmt(total(u))} ${currency()}`,
    `🔖 *Ticks:* ${fmt(u.toruexp)}`,
    `✨ *Nivel ${u.level}* ${bar(pct)} ${pct}%`
  ].filter(Boolean)
}

/** Cooldown por usuario y acción */
export function cooldown(u, key, time) {
  const now = Date.now()
  const last = Number(u.eco.cd[key]) || 0
  const left = last + time - now
  if (left > 0) return { ok: false, left }
  u.eco.cd[key] = now
  return { ok: true, left: 0 }
}

export const canUse = (u, key, time) => {
  const last = Number(u.eco.cd[key]) || 0
  const left = last + time - Date.now()
  return { ok: left <= 0, left: left > 0 ? left : 0 }
}

export function waitPanel(u, title, left, tip = '') {
  return panel(title, [
    `⏳ Vuelve en: *${human(left)}*`,
    tip ? `💡 ${tip}` : null,
    '',
    ...walletRows(u)
  ], sign())
}

export const ITEMS = {
  pico: { name: 'Pico de Diamante', emoji: '⛏️', price: 3500, boost: 0.45, desc: 'Aumenta tus ganancias al minar (+45%).' },
  hacha: { name: 'Motosierra de Bulma', emoji: '🪓', price: 3200, boost: 0.45, desc: 'Aumenta tus ganancias al talar (+45%).' },
  cana: { name: 'Caña Maestra', emoji: '🎣', price: 3000, boost: 0.45, desc: 'Aumenta tus ganancias al pescar (+45%).' },
  rifle: { name: 'Rifle Kame', emoji: '🔫', price: 4200, boost: 0.5, desc: 'Aumenta tus ganancias al cazar (+50%).' },
  escudo: { name: 'Escudo de Ki', emoji: '🛡️', price: 2500, boost: 0, desc: 'Bloquea automáticamente un intento de robo.' },
  cofre: { name: 'Cofre del Dragón', emoji: '🎁', price: 6000, boost: 0, desc: 'Ábrelo con #cofre para un premio aleatorio.' }
}

export const itemName = key => ITEMS[key]?.name || key

export function useItem(u, key) {
  if (!key) return null
  const n = Number(u.inv[key]) || 0
  if (n <= 0) return null
  u.inv[key] = n - 1
  return ITEMS[key] || { name: key, emoji: '🎒', boost: 0 }
}

export const countItem = (u, key) => Number(u.inv[key]) || 0

export function addItem(u, key, amount = 1) {
  u.inv[key] = (Number(u.inv[key]) || 0) + amount
  return u.inv[key]
}

/** Suma (o resta) monedas sin bajar de 0 */
export function addMoney(u, amount) {
  const v = Number(amount) || 0
  u.torucoin = Math.max(0, (Number(u.torucoin) || 0) + v)
  return u.torucoin
}

export function isGroupEnabled(m, flag = 'fRpg') {
  if (!m.isGroup) return true
  const chat = global.db?.data?.chats?.[m.chat]
  if (!chat) return true
  return chat[flag] !== false
}

export const disabledPanel = (usedPrefix, flag = 'rpg') =>
  panel('🚫 COMANDOS DESACTIVADOS', [
    `📍 Los comandos de *[ economía / ${flag} ]* están desactivados en este grupo.`,
    `💡 Un administrador puede activarlos con *${usedPrefix}on ${flag}*`
  ], sign())

/**
 * Motor genérico de trabajos: minar, talar, pescar, cazar, trabajar, slut, crimen...
 */
export async function runJob(m, { conn, usedPrefix }, cfg) {
  if (!isGroupEnabled(m, 'fRpg'))
    return conn.sendMessage(m.chat, { text: disabledPanel(usedPrefix, 'rpg') }, { quoted: m })

  const u = getUser(m.sender)
  if (!u) return

  const cd = cooldown(u, cfg.key, cfg.cdMs)
  if (!cd.ok) {
    const tip = typeof cfg.waitTip === 'function' ? cfg.waitTip(usedPrefix) : cfg.waitTip
    return conn.sendMessage(m.chat, { text: waitPanel(u, `${cfg.emoji} ${cfg.title}`, cd.left, tip) }, { quoted: m })
  }

  const danger = cfg.danger?.length && chance(cfg.dangerChance ?? 10) ? pick(cfg.danger) : null
  const outcome = danger || pickWeighted(cfg.loot)

  let coins = randInt(...(outcome.coins || [0, 0]))
  const ticks = danger ? 0 : randInt(...(outcome.ticks || cfg.ticks || [0, 0]))

  const extra = []
  if (!danger && cfg.item) {
    const item = useItem(u, cfg.item)
    if (item?.boost) {
      const bonus = Math.round(coins * item.boost)
      coins += bonus
      extra.push(`${item.emoji} Usaste *${item.name}*: +${fmt(bonus)} extra`)
    } else if (item) {
      extra.push(`${item.emoji} Usaste *${item.name}*`)
    }
  }

  if (!danger && outcome.inv)
    for (const [k, v] of Object.entries(outcome.inv)) {
      addItem(u, k, v)
      extra.push(`${ITEMS[k]?.emoji || '🎁'} Obtuviste *${itemName(k)}* x${v}`)
    }

  addMoney(u, coins)
  u.toruexp += ticks
  u.eco.stats[cfg.key] = (Number(u.eco.stats[cfg.key]) || 0) + 1

  const rows = [
    `👤 *Usuario:* @${String(m.sender).split('@')[0]}`,
    '',
    outcome.text,
    '',
    coins >= 0 ? `🪙 *Ganancia:* +${fmt(coins)} ${currency()}` : `💸 *Pérdida:* ${fmt(coins)} ${currency()}`,
    ticks > 0 ? `🔖 *Ticks:* +${fmt(ticks)}` : null,
    ...extra,
    '',
    `🪙 *Cartera:* ${fmt(u.torucoin)} ${currency()}`,
    `🏦 *Banco:* ${fmt(u.bank)} ${currency()}`,
    `📊 *Intentos:* ${fmt(u.eco.stats[cfg.key])}`,
    `⏳ *Espera:* ${human(cfg.cdMs)}`
  ]

  await conn.sendMessage(m.chat, {
    text: panel(`${cfg.emoji} ${cfg.title}`, rows, sign()),
    mentions: [m.sender]
  }, { quoted: m })
}

/** Resuelve el objetivo de un comando (mención, cita o número) */
export function targetJid(m, args = []) {
  const mentioned = m.mentionedJid?.[0]
  if (mentioned) return mentioned
  const quoted = m.quoted?.sender
  if (quoted) return quoted
  const num = args.find(a => /^\d{8,16}$/.test(String(a).replace(/[^0-9]/g, '')))
  if (num) return String(num).replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  return null
}

/** Devuelve "100", "50%" o "all" en monedas del usuario */
export function parseAmount(text, u) {
  const raw = String(text || '').toLowerCase().replace(/[^0-9%a-z]/g, '')
  if (!raw) return null
  if (/^(all|todo|max|mina|minar)$/.test(raw)) return Number(u.torucoin) || 0
  if (/^\d+%$/.test(raw)) {
    const p = Math.min(100, parseInt(raw)) / 100
    return Math.floor((Number(u.torucoin) || 0) * p)
  }
  if (/^\d+$/.test(raw)) return parseInt(raw)
  return null
}
