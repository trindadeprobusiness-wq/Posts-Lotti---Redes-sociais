// n8n · nó Code "Escolher peça do slot" (modo: Run Once for All Items)
// Entrada: saída do nó "Baixar calendário" (o JSON lotti-instagram.json).
// Precisa de um nó Set chamado "Config" antes, com:
//   ig_user_id, json_url, midia_base_url, email_alerta, data_forcada (vazio), slot_forcado (vazio)

const cfg = $('Config').first().json;
const cal = $input.first().json;
const agora = $now.setZone('America/Sao_Paulo');
const data = cfg.data_forcada || agora.toFormat('yyyy-MM-dd');
const h = agora.hour;
const slot = cfg.slot_forcado || (h < 11 ? '10:00' : h < 15 ? '12:00' : '18:00');

const slotDe = (p) =>
  p.tipo === 'STORY' && p.periodo === 'Manhã' ? '10:00'
  : p.tipo === 'FEED' && p.periodo === 'Manhã' ? '12:00'
  : p.tipo === 'FEED' && p.periodo === 'Tarde' ? '18:00'
  : 'manual';

const base = String(cfg.midia_base_url || cal.midia_base_url).replace(/\/$/, '');
const urlDe = (m) => m.url_publica || base + '/' + m.caminho_post.split('/').map(encodeURIComponent).join('/');
const isVideo = (u) => /\.mp4($|\?)/i.test(u);

const doDia = (cal.posts || []).filter((p) => p.data === data);
const peca = doDia.find((p) => slotDe(p) === slot);

// Resumo do dia (vai no e-mail das 10h)
const linhas = doDia.map((p) => {
  const s = slotDe(p);
  const manual = s === 'manual';
  const aviso = p.status !== 'pronto_para_postar' ? ` <b style="color:#b25e00">(${p.status}: NÃO sai)</b>` : '';
  return `<li>${manual ? '✋ <b>MANUAL</b>' : s} · ${p.formato} · ${p.tema || '(sem tema)'}${aviso}` +
    (manual && p.sticker && p.sticker !== 'Não se aplica' ? `<br><small>Sticker: ${p.sticker}</small>` : '') + '</li>';
});
const resumo_html = `<h3>Programação de ${data}</h3><ul>${linhas.join('') || '<li>Nada programado.</li>'}</ul>`;

if (!peca) return [{ json: { acao: 'nada', data, slot, resumo_html } }];

const urls = peca.midias.slice().sort((a, b) => a.ordem - b.ordem).map(urlDe);
const t = peca.ig_media_type;
const container_params =
  t === 'IMAGE' ? { image_url: urls[0], caption: peca.legenda }
  : t === 'REELS' ? { media_type: 'REELS', video_url: urls[0], caption: peca.legenda, share_to_feed: true }
  : t === 'STORIES' ? (isVideo(urls[0])
      ? { media_type: 'STORIES', video_url: urls[0] }
      : { media_type: 'STORIES', image_url: urls[0] })
  : null;
const carrossel = t === 'CAROUSEL'
  ? urls.slice(0, 10).map((u) => isVideo(u)
      ? { media_type: 'VIDEO', video_url: u, is_carousel_item: true }
      : { image_url: u, is_carousel_item: true })
  : [];

const problemas = [];
if (peca.status !== 'pronto_para_postar') problemas.push('status ' + peca.status);
if (!urls.length) problemas.push('sem mídia');
if (t === 'CAROUSEL' && urls.length < 2) problemas.push('carrossel com menos de 2 slides');

return [{
  json: {
    acao: problemas.length ? 'pular' : 'publicar',
    motivo: problemas.join('; '),
    data, slot, resumo_html,
    peca_id: peca.id, tipo: t, formato: peca.formato, tema: peca.tema, legenda: peca.legenda,
    urls, container_params, carrossel,
  },
}];
