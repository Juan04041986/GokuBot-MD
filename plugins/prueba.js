/**
 * prueba — .play con respaldos
 * Autor: Gus · Licencia MIT
 * Adaptado a estructura Goku Bot
 */

const CANAL = 'https://whatsapp.com/channel/0029VbDPchgEAKWO4mMYtC1Q';

const caja = (titulo, lineas, pie = 'Gus') =>
    '╭┈──◯◝ ⬢ *' + titulo + '*\n' +
    lineas.filter(Boolean).map((l) => (l.startsWith('>') ? l : '┆ ❀ ' + l)).join('\n') + '\n' +
    '╰┈──◯◞ ✿ ' + pie + '\n' +
    '> 🌸 Sigue el canal › ' + CANAL;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const CLIENTE = { clientName: 'ANDROID_VR', clientVersion: '1.60.19', androidSdkVersion: 32, deviceModel: 'Quest 3', osName: 'Android', osVersion: '12', hl: 'es', gl: 'US' };
const TOPE = 48 * 1024 * 1024;

const enc = (t) => encodeURIComponent(t);

const idDe = (e) => {
    const m = String(e).match(/(?:v=|youtu\.be\/|shorts\/|live\/|embed\/)([\w-]{11})/) || String(e).match(/^([\w-]{11})$/);
    return m ? m[1] : null;
};

const aSegundos = (v) => {
    if (typeof v === 'number') return v;
    const p = String(v || '').trim().split(':');
    if (!p.length || p.some((x) => !/^\d+$/.test(x))) return 0;
    return p.reduce((t, x) => t * 60 + Number(x), 0);
};

const mmss = (s) => (s ? Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0') : '—');

const pedirJson = async (url, ms = 25000) => {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(ms) });
    if (!res.ok) throw new Error('respondió ' + res.status);
    return res.json();
};

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
    const res = await fetch('https://www.youtube.com/results?hl=es&search_query=' + enc(consulta), {
        headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' },
        signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error('YouTube respondió ' + res.status);
    const id = ((await res.text()).match(/"videoId":"([\w-]{11})"/) || [])[1];
    if (!id) throw new Error('no encontré nada con esa búsqueda');
    return id;
};

const pagina = async (id) => {
    const res = await fetch('https://www.youtube.com/watch?v=' + id + '&hl=es', {
        headers: { 'User-Agent': UA, 'Accept-Language': 'es-ES,es;q=0.9' },
        signal: AbortSignal.timeout(20000)
    });
    if (!res.ok) throw new Error('no pude abrir el video (' + res.status + ')');
    const d = extraerJson(await res.text(), 'ytInitialPlayerResponse');
    if (!d) return { det: {}, formatos: [], estado: null };
    const fs = [...(d?.streamingData?.formats || []), ...(d?.streamingData?.adaptiveFormats || [])].filter((f) => f.url);
    return { det: d.videoDetails || {}, formatos: fs, estado: d?.playabilityStatus?.status || null };
};

const porApi = async (id) => {
    const res = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
        body: JSON.stringify({ context: { client: CLIENTE }, videoId: id, contentCheckOk: true, racyCheckOk: true }),
        signal: AbortSignal.timeout(15000)
    });
    const d = await res.json();
    const fs = [...(d?.streamingData?.formats || []), ...(d?.streamingData?.adaptiveFormats || [])].filter((f) => f.url);
    return { det: d?.videoDetails || {}, formatos: fs, estado: d?.playabilityStatus?.status || null };
};

const RESPALDOS = [
    {
        nombre: 'abztech',
        url: (id) => 'https://api-abztech.zone.id/download/ytmp3?url=' + enc('https://youtu.be/' + id),
        sacar: (d) => ({ link: d.downloadUrl || d.url || d?.download?.downloadUrl, titulo: d.title, ext: '.mp3', calidad: d?.download?.format || 'mp3' })
    },
    {
        nombre: 'ryuzei',
        url: (id) => 'https://api.ryuzei.xyz/download/ytmp3/v2?url=' + enc('https://youtu.be/' + id),
        sacar: (d) => ({ link: d?.data?.download, titulo: d?.data?.title, canal: d?.data?.author, dur: aSegundos(d?.data?.duration), ext: '.mp3', calidad: d?.data?.quality })
    },
    {
        nombre: 'delirius',
        url: (id) => 'https://api.delirius.online/download/ytmp3?url=' + enc('https://youtu.be/' + id),
        sacar: (d) => ({ link: d?.data?.download || d?.data?.url, titulo: d?.data?.title, ext: '.mp3', calidad: 'mp3' })
    }
];

const revisar = (buf) => {
    if (buf.length > TOPE) throw new Error('el audio pasa de ' + Math.round(TOPE / 1048576) + ' MB');
    if (buf.length < 20000) throw new Error('llegó un archivo vacío');
    return buf;
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

const bajar = async (url) => {
    let total = 0;
    try {
        const sonda = await fetch(url, { headers: { 'User-Agent': UA, Range: 'bytes=0-0' }, signal: AbortSignal.timeout(25000) });
        if (sonda.status === 200) return revisar(Buffer.from(await sonda.arrayBuffer()));
        const cr = sonda.headers.get('content-range');
        if (cr) total = Number(String(cr).split('/')[1]) || 0;
    } catch {}
    if (!total) {
        const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(180000) });
        if (!res.ok) throw new Error('la descarga falló (' + res.status + ')');
        return revisar(Buffer.from(await res.arrayBuffer()));
    }
    if (total > TOPE) throw new Error('el archivo pasa de ' + Math.round(TOPE / 1048576) + ' MB, probá algo más corto');
    const trozos = Math.min(8, Math.max(2, Math.ceil(total / (4 * 1048576))));
    const tam = Math.ceil(total / trozos);
    const partes = await Promise.all(Array.from({ length: trozos }, (_, i) => rango(url, i * tam, Math.min(total - 1, (i + 1) * tam - 1))));
    if (partes.some((p) => !p.sigue)) return revisar(partes[0].buf);
    return revisar(Buffer.concat(partes.map((p) => p.buf)));
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

const elegirAudio = (formatos) => {
    const m4a = formatos.filter((f) => (f.mimeType || '').startsWith('audio/mp4')).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
    if (m4a) return m4a;
    return formatos.filter((f) => (f.mimeType || '').startsWith('audio/')).sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0] || null;
};

const conseguir = async (id) => {
    let det = {};
    let motivo = 'YouTube no entregó el enlace de descarga';
    for (const intento of [porApi, pagina]) {
        try {
            const r = await intento(id);
            det = r.det?.title ? r.det : det;
            const audio = elegirAudio(r.formatos);
            if (audio) {
                const buf = await bajar(audio.url);
                const ext = (audio.mimeType || '').includes('webm') ? '.webm' : '.m4a';
                return { buf, ext, det, fuente: 'YouTube', calidad: Math.round((audio.bitrate || 0) / 1000) + ' kbps' };
            }
            if (r.estado === 'LOGIN_REQUIRED') motivo = 'YouTube pidió iniciar sesión desde esta IP';
        } catch (e) { motivo = e?.message || motivo; }
    }
    for (const r of RESPALDOS) {
        try {
            const d = await pedirJson(r.url(id));
            const dato = r.sacar(d);
            if (!dato?.link) continue;
            const buf = await bajar(dato.link);
            return {
                buf,
                ext: dato.ext,
                det: { title: det.title || dato.titulo, author: det.author || dato.canal, lengthSeconds: det.lengthSeconds || dato.dur },
                fuente: r.nombre,
                calidad: dato.calidad || 'mp3'
            };
        } catch {}
    }
    throw new Error(motivo + ' (y los respaldos tampoco contestaron)');
};

const handler = async (m, { text, conn, command, usedPrefix }) => {
    const p = usedPrefix || '.';
    const responder = (payload) => conn.sendMessage(m.chat, payload, { quoted: m });
    const consulta = String(text || '').trim();

    if (!consulta) {
        return responder({ text: caja('PLAY', [
            `*Uso* › ${p}${command} <link o nombre>`,
            `*Ejemplo* › ${p}${command} coldplay - yellow`,
            '> Sale en mp3, sin API key ♡'
        ]) });
    }

    try {
        const id = idDe(consulta) || (await buscar(consulta));
        const { buf, ext, det, fuente, calidad } = await conseguir(id);
        const titulo = det?.title || 'audio';
        const canal = det?.author || '—';
        const dur = mmss(aSegundos(det?.lengthSeconds));

        if (process.env.AKAME_TEST === '1') {
            return responder({ text: caja('PLAY · OK', [
                '*' + titulo + '*',
                '👤 ' + canal + ' · ⏱️ ' + dur,
                '🎧 ' + calidad + ' · 📦 ' + (buf.length / 1048576).toFixed(1) + ' MB',
                '> vía ' + fuente + ' ♡'
            ]) });
        }

        const ficha = caja('PLAY', [
            '*' + titulo + '*',
            '👤 ' + canal + ' · ⏱️ ' + dur,
            '📦 ' + (buf.length / 1048576).toFixed(1) + ' MB · 🗂️ ' + ext,
            '> vía ' + fuente + ' ♡'
        ]);
        const foto = await miniatura(id);
        if (foto) await responder({ image: foto, caption: ficha });
        else await responder({ text: ficha });

        return responder({
            audio: buf,
            mimetype: ext === '.webm' ? 'audio/webm' : (ext === '.mp3' ? 'audio/mpeg' : 'audio/mp4'),
            fileName: titulo.replace(/[\\/:*?"<>|]/g, '').slice(0, 70) + ext,
            ptt: false
        });
    } catch (e) {
        return responder({ text: caja('NO PUDE', [
            '› ' + (e?.message || 'algo salió mal'),
            '> Probá con otro link ♡'
        ]) });
    }
}

handler.command = ['prueba', 'play', 'playaudio', 'musica']
handler.tags = ['descargas']
export default handler
