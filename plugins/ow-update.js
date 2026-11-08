import { execSync } from 'child_process'

// --- FIX PARA OWNER CON USERNAME / LID ---
function isOwnerReal(m, conn) {
  // Tu número, el del bot, y los del config
  let owners = global.owner || []
  // Si tu config usa otro nombre, también lo lee
  if (global.config?.owner) owners = owners.concat(global.config.owner)

  // Saca solo los números de los owners (sin @, sin +, sin espacios)
  let ownerNumbers = owners.map(v => {
    let n = Array.isArray(v) ? v[0] : v
    return String(n).replace(/[^0-9]/g, '')
  }).filter(Boolean)

  // Saca tu número de donde venga: sender, participant, lid, etc
  let myIds = [
    m.sender,
    m.key?.participant,
    m.key?.remoteJid,
    conn.user?.jid
  ].filter(Boolean)

  // Saca solo números de tus IDs
  let myNumbers = myIds.map(id => String(id).replace(/[^0-9]/g, ''))

  // Si eres tú mismo (el número del bot) también eres owner
  if (m.fromMe) return true

  // Compara: ¿algún número tuyo está en la lista de owners?
  return myNumbers.some(num => ownerNumbers.some(owner => 
    owner.endsWith(num.slice(-8)) || num.endsWith(owner.slice(-8)) || owner === num
  ))
}

var handler = async (m, { conn, text, isROwner }) => {
  // Ya no usamos handler.rowner, lo chequeamos aquí
  if (!isOwnerReal(m, conn) && !isROwner) {
    return conn.sendMessage(m.chat, { text: `📍 No eres owner bro, tu ID es: ${m.sender}` }, { quoted: m })
  }

  // Si el chat tiene fOwners desactivado y es grupo, no hacer nada (pero owner sí puede)
  // Quitamos el bloqueo anterior que te sacaba

  await m.react("⏰").catch(() => {})
  try {
    const stdout = execSync('git pull' + (m.fromMe && text ? ' ' + text : ''));
    let messager = stdout.toString()
    if (messager.includes('📍  La actualización de la pagina web ya esta en un estado normal.')) messager = '📍  La actualización del la pagina ya esta completa, no es necesario actualizarla.'
    if (messager.includes('⏳  Actualización pendiente...')) messager = '✓  *[ WEB : ACTUALIZADO ]*\n\n' + stdout.toString()
    conn.sendMessage(m.chat, { text: `\`\`\`${messager}\`\`\`` }, { quoted: m })
  } catch {
    try {
      const status = execSync('git status --porcelain')
      if (status.length > 0) {
        const conflictedFiles = status.toString().split('\n').filter(line => line.trim() !== '').map(line => {
          if (line.includes('.npm/') || line.includes('.cache/') || line.includes('tmp/') || line.includes('database.json') || line.includes('sessions/Principal/') || line.includes('npm-debug.log')) {
            return null
          }
          return '*→ ' + line.slice(3) + '*'
        }).filter(Boolean)
        if (conflictedFiles.length > 0) {
          const errorMessage = `📍  [ ERROR ]:\n\n${conflictedFiles.join('\n')}.`
          await conn.reply(m.chat, errorMessage, m)
        }
      }
    } catch (error) {
      console.error(error)
      let errorMessage2 = '📍  [ ERROR ]'
      if (error.message) {
        errorMessage2 += '\n•> error: ' + error.message
      }
      await conn.sendMessage(m.chat, { text: errorMessage2 }, { quoted: m })
    }
  }
}

handler.help = ['update']
handler.tags = ['owner']
handler.command = ['update', 'fix', 'actualizar']
// NO PONGAS handler.rowner = true, ESO ES LO QUE TE BLOQUEABA
handler.rowner = false
export default handler
