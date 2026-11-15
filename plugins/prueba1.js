// prueba1.js — .play en TU estructura de Goku Bot
// Autor original: Gus | Adaptado a tu handler

const CANAL = 'https://whatsapp.com/channel/0029VbDPchgEAKWO4mMYtC1Q';

const caja = (titulo, lineas, pie = 'Gus') =>
    '╭┈──◯◝ ⬢ *' + titulo + '*\n' +
    lineas.filter(Boolean).map((l) => (l.startsWith('>') ? l : '┆ ❀ ' + l)).join('\n') + '\n' +
    '╰┈──◯◞ ✿ ' + pie + '\n' +
    '> 🌸 Sigue el canal › ' + CANAL;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const CLIENTE = { clientName: 'ANDROID_VR', clientVersion: '1.60.19', androidSdkVersion: 32, deviceModel: 'Quest 3', osName: 'Android', osVersion: '12', hl: 'es', gl: 'US' };
const TOPE = 48 * 1024 * 1024;

const idDe = (e) => {
    const m = String(e).match(/(?:v=|youtu\.be\/|shorts\/|live\/|embed\/)([\w-]{11})/) || String(e).match(/^([\w-]{11})$/);
    return m ? m[1] : null;
};
const aSegundos = (v) => {
    const p = String(v || '').trim().split(':');
    if (!p.length || p.some((x) => !/^\d+$/.test(x))) return 0;
    return p.reduce((t, x) => t * 60 + Number(x), 0);
};
const mmss = (s) => (s ? Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0') : '—');
const extraerJson = (html, marca) => {
    const i = html.indexOf(marca);
    if (i < 0) return null;
    const ini = html.indexOf('{', i);
    let prof = 0, fin = -1, enCadena = false, escape = false;
    for (let k = ini; k < html.length; k++) {
        const c = html[k];
        if (escape) { escape = false; continue; }
        if (c === '\\') { escape = true; continue; }
        if (c === '"') enCadena = !enCadena;
        if (enCadena) continue;
        if (c === '{') prof++;
        else if (c === '}') { prof--; if (!prof) { fin = k + 1; break; } }
    }
    if (fin < 0) return null;
    try { return JSON.parse(html.slice(ini, fin)); } catch { return null; }
};
const buscar = async (consulta) => {
    const url = 'https://www.youtube.com/results?hl=es&search_query=' + encodeURIComponent(consulta);
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error('YouTube respondió ' + res.status);
    const html = await res.text();
    const id = (html.match(/"videoId":"([\w-]{11})"/) || [])[1];
    if (!id) throw new Error('no encontré nada con esa búsqueda');
    return { id };
};
const pagina = async (id) => {
    const res = await fetch('https://www.youtube.com/watch?v=' + id + '&hl=es', { headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error('no pude abrir el video (' + res.status + ')');
    const d = extraerJson(await res.text(), 'ytInitialPlayerResponse');
    if (!d) throw new Error('YouTube cambió la página del video');
    return d;
};
const porApi = async (id) => {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
        body: JSON.stringify({ context: { client: CLIENTE }, videoId: id, contentCheckOk: true, racyCheckOk: true }),
        signal: AbortSignal.timeout(20000)
    });
    return res.json();
};
const conUrl = (d) => [...(d?.streamingData?.formats || []), ...(d?.streamingData?.adaptiveFormats || [])].filter((f) => f.url);
const resolver = async (id) => {
    let d = null;
    try { d = await porApi(id); } catch {}
    let formatos = conUrl(d);
    if (!formatos.length) {
        const p = d && d.videoDetails ? d : await pagina(id);
        formatos = conUrl(p);
        d = p;
    }
    const estado = d?.playabilityStatus?.status;
    const det = d?.videoDetails || {};
    if (!formatos.length) {
        const motivo = estado === 'LOGIN_REQUIRED' ? 'YouTube pidió iniciar sesión (bloqueo anti-bot de esta IP)' : 'YouTube no entregó el enlace (bloqueo por IP)';
        const err = new Error(motivo);
        err.det = det;
        throw err;
    }
    return { det, formatos };
};
const elegirAudio = (formatos) => {
    const m4a = formatos.filter((f) => (f.mimeType || '').startsWith('audio/mp4')).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    if (m4a) return m4a;
    return formatos.filter((f) => (f.mimeType || '').startsWith('audio/')).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0] || null;
};
const miniatura = async (id) => {
    for (const nombre of ['hqdefault', 'mqdefault']) {
        try {
            const res = await fetch('https://i.ytimg.com/vi/' + id + '/' + nombre + '.jpg', { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(8000) });
            if (res.ok) return Buffer.from(await res.arrayBuffer());
        } catch {}
    }
    return null;
};
const rango = async (url, desde, hasta, intentos = 3) => {
    for (let i = 1; i <= intentos; i++) {
        try {
            const res = await fetch(url, { headers: { 'User-Agent': UA, Range: 'bytes=' + desde + '-' + hasta }, signal: AbortSignal.timeout(60000) });
            if (res.status === 206) return { sigue: true, buf: Buffer.from(await res.arrayBuffer()) };
            if (res.status === 200) return { sigue: false, buf: Buffer.from(await res.arrayBuffer()) };
            throw new Error('la descarga falló (' + res.status + ')');
        } catch (e) { if (i === intentos) throw e; }
    }
};
const revisar = (buf) => {
    if (buf.length > TOPE) throw new Error('el archivo pasa de ' + Math.round(TOPE / 1048576) + ' MB');
    if (buf.length < 20000) throw new Error('YouTube devolvió un archivo vacío');
    return buf;
};
const bajar = async (url, total = 0) => {
    if (total > TOPE) throw new Error('el audio pasa de ' + Math.round(TOPE / 1048576) + ' MB, probá algo más corto');
    if (!total) {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(180000) });
        if (!res.ok) throw new Error('la descarga falló (' + res.status + ')');
        return revisar(Buffer.from(await res.arrayBuffer()));
    }
    const trozos = Math.min(8, Math.max(2, Math.ceil(total / (4 * 1048576))));
    const tam = Math.ceil(total / trozos);
    const partes = await Promise.all(Array.from({ length: trozos }, (_, i) => rango(url, i * tam, Math.min(total - 1, (i + 1) * tam - 1))));
    if (partes.some((p) => !p.sigue)) return revisar(partes[0].buf);
    return revisar(Buffer.concat(partes.map((p) => p.buf)));
};

const handler = async (m, { text, conn, command, usedPrefix }) => {
  const responder = (payload) => conn.sendMessage(m.chat, payload, { quoted: m });
  const consulta = String(text || '').trim();
  const p = usedPrefix || '.';

  if (!consulta) {
    return responder({ text: caja('PLAY', [
      `*Uso* › ${p}${command} <link o nombre>`,
      `*Ejemplo* › ${p}${command} coldplay - yellow`,
      '> Sale en .m4a, sin API key ♡'
    ]) });
  }

  try {
    const id = idDe(consulta) || (await buscar(consulta)).id;
    const { det, formatos } = await resolver(id);
    const audio = elegirAudio(formatos);
    if (!audio) throw new Error('este video no tiene audio disponible');
    const titulo = det.title || 'audio';
    const canal = det.author || '—';
    const dur = mmss(aSegundos(det.lengthSeconds));
    const buf = await bajar(audio.url, +audio.contentLength || 0);
    const ext = (audio.mimeType || '').includes('webm') ? '.webm' : '.m4a';
    const ficha = caja('PLAY', [
      '*' + titulo + '*',
      '👤 ' + canal + ' · ⏱️ ' + dur,
      '📦 ' + (buf.length / 1048576).toFixed(1) + ' MB · 🗂️ ' + ext,
      '> Fuente › YouTube ♡'
    ]);
    const foto = await miniatura(id);
    if (foto) await responder({ image: foto, caption: ficha });
    else await responder({ text: ficha });
    return responder({
      audio: buf,
      mimetype: ext === '.webm' ? 'audio/webm' : 'audio/mp4',
      fileName: titulo.replace(/[\\/:*?"<>|]/g, '').slice(0, 70) + ext,
      ptt: false
    });
  } catch (e) {
    return responder({ text: caja('NO PUDE', [
      '› ' + (e?.message || 'algo salió mal'),
      e?.det?.title ? '*' + e.det.title + '*' : '',
      '> Probá otro video o desde otra red ♡'
    ]) });
  }
}

handler.command = ['prueba1', 'play', 'playaudio', 'musica']
handler.tags = ['descargas']
export default handler
