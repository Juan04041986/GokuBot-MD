// Este archivo registra todo, no es un comando
export async function before(m, { conn }) {
if (!m.text || m.isBaileys) return
let prefix = global.prefix || '.'
let isPref = Array.isArray(prefix) ? prefix.some(p => m.text.startsWith(p)) : m.text.startsWith(prefix)
if (!isPref) return

let cmd = m.text.slice(1).trim().split(' ')[0].toLowerCase()
if (!cmd) return

// Fecha de hoy en Perú
let hoy = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })

if (!global.db.data.actividad) global.db.data.actividad = {}
if (global.db.data.actividad.fecha !== hoy) {
  global.db.data.actividad = { fecha: hoy, total: 0, usuarios: {}, comandos: {}, ultimos: [] }
}
let act = global.db.data.actividad

act.total = (act.total || 0) + 1
act.comandos[cmd] = (act.comandos[cmd] || 0) + 1

if (!act.usuarios[m.sender]) act.usuarios[m.sender] = { total: 0, comandos: {} }
act.usuarios[m.sender].total += 1
act.usuarios[m.sender].comandos[cmd] = (act.usuarios[m.sender].comandos[cmd] || 0) + 1

act.ultimos.unshift({
  user: m.sender,
  cmd: cmd,
  texto: m.text.slice(0, 60),
  hora: new Date().toLocaleTimeString('es-PE', { timeZone: 'America/Lima', hour: '2-digit', minute: '2-digit' }),
  grupo: m.isGroup ? (m.chat || '') : 'Privado'
})
if (act.ultimos.length > 20) act.ultimos = act.ultimos.slice(0, 20)

return
}
