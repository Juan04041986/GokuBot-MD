/**
 * .clima <ciudad> — clima de hoy y pronóstico de 3 días.
 * Autor: Gus · Licencia MIT
 * Adaptado a estructura Goku Bot
 */

const GEO = 'https://geocoding-api.open-meteo.com/v1/search';
const CLIMA = 'https://api.open-meteo.com/v1/forecast';

const CANAL = 'https://whatsapp.com/channel/0029VbDPchgEAKWO4mMYtC1Q';

const caja = (titulo, lineas, pie = 'Gus') =>
    '╭┈──◯◝ ⬢ *' + titulo + '*\n' +
    lineas.filter(Boolean).map((l) => (l.startsWith('>') ? l : '┆ ❀ ' + l)).join('\n') + '\n' +
    '╰┈──◯◞ ✿ ' + pie + '\n' +
    '> 🌸 Sigue el canal › ' + CANAL;

const pedir = async (url) => {
    const res = await fetch(url, {
        headers: {
            'User-Agent': 'AKAME-SCRAPERS/1.0 (+https://github.com/Gus-1337/AKAME-SCRAPERS)',
            Accept: 'application/json'
        },
        signal: AbortSignal.timeout(12000)
    });
    if (!res.ok) throw new Error('Open-Meteo respondió ' + res.status);
    return res.json();
};

/** Códigos WMO → emoji y palabra (los que importan). */
const CLIMA_TEXTO = {
    0: ['☀️', 'Despejado'], 1: ['🌤️', 'Mayormente despejado'], 2: ['⛅', 'Parcialmente nublado'],
    3: ['☁️', 'Nublado'], 45: ['🌫️', 'Niebla'], 48: ['🌫️', 'Niebla helada'],
    51: ['🌦️', 'Llovizna leve'], 53: ['🌦️', 'Llovizna'], 55: ['🌧️', 'Llovizna fuerte'],
    61: ['🌧️', 'Lluvia leve'], 63: ['🌧️', 'Lluvia'], 65: ['🌧️', 'Lluvia fuerte'],
    66: ['🌧️', 'Lluvia helada'], 67: ['🌧️', 'Lluvia helada fuerte'],
    71: ['🌨️', 'Nieve leve'], 73: ['🌨️', 'Nieve'], 75: ['❄️', 'Nieve fuerte'],
    80: ['🌦️', 'Chaparrones'], 81: ['🌧️', 'Chaparrones fuertes'], 82: ['⛈️', 'Chaparrones muy fuertes'],
    95: ['⛈️', 'Tormenta'], 96: ['⛈️', 'Tormenta con granizo'], 99: ['⛈️', 'Tormenta fuerte']
};

const clima = (codigo) => CLIMA_TEXTO[Number(codigo)] || ['🌡️', 'Código ' + codigo];

const dia = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    return ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][d.getDay()] + ' ' + d.getDate();
};

const handler = async (m, { text, conn, command, usedPrefix }) => {
    const p = usedPrefix || '.';
    const responder = (texto) => conn.sendMessage(m.chat, { text: texto }, { quoted: m });

    const ciudad = String(text || '').trim();
    if (!ciudad) {
        return responder(caja('CLIMA', [
            `*Uso* › ${p}${command} <ciudad>`,
            `*Ejemplo* › ${p}${command} Buenos Aires`,
            '> Datos de Open-Meteo, sin API key ♡'
        ]));
    }

    try {
        const geo = await pedir(GEO + '?name=' + encodeURIComponent(ciudad) + '&count=1&language=es&format=json');
        const lugar = geo?.results?.[0];
        if (!lugar) {
            return responder(caja('NO ENCONTRÉ ESA CIUDAD', [ 'Probá con el nombre completo › *' + ciudad + '* ♡' ]));
        }

        const q =
            '?latitude=' + lugar.latitude + '&longitude=' + lugar.longitude +
            '&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m' +
            '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max' +
            '&timezone=auto&forecast_days=3';
        const datos = await pedir(CLIMA + q);

        const ahora = datos.current;
        const [emoji, palabra] = clima(ahora.weather_code);
        const donde = [lugar.name, lugar.admin1, lugar.country].filter(Boolean).join(', ');

        const dias = (datos.daily?.time || []).map((f, i) => {
            const [e] = clima(datos.daily.weather_code[i]);
            const max = Math.round(datos.daily.temperature_2m_max[i]);
            const min = Math.round(datos.daily.temperature_2m_min[i]);
            const lluvia = datos.daily.precipitation_probability_max?.[i];
            return e + ' *' + dia(f) + '* › ' + max + '° / ' + min + '°' +
                (lluvia != null ? ' · 💧' + lluvia + '%' : '');
        });

        return responder(caja('CLIMA · ' + lugar.name.toUpperCase(), [
            '*' + donde + '*',
            '',
            emoji + ' *' + Math.round(ahora.temperature_2m) + '°C* — ' + palabra,
            '🌡️ Sensación › ' + Math.round(ahora.apparent_temperature) + '°C',
            '💧 Humedad › ' + ahora.relative_humidity_2m + '%',
            '💨 Viento › ' + Math.round(ahora.wind_speed_10m) + ' km/h',
            '',
            ...dias,
            '',
            '> Fuente: Open-Meteo ♡'
        ]));
    } catch (e) {
        return responder(caja('NO PUDE', [ e?.message || 'algo salió mal', '> Probá de nuevo ♡' ]));
    }
}

handler.command = ['clima', 'tiempo', 'temperatura']
handler.tags = ['utiles']
export default handler 
