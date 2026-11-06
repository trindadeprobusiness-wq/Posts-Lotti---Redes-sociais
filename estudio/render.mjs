// Estúdio de variações da Lotti.
// Lê estudio/marca.json + estudio/pecas/*.json e gera JPEGs em variacoes/<id>/<A|B|C>/,
// já com o nome final do arquivo, mais a galeria variacoes/index.html para aprovação.
//
// Uso:  node estudio/render.mjs            (todas as peças)
//       node estudio/render.mjs 02 05      (só estas)

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { chromium } = createRequire(import.meta.url)('playwright');
const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const marca = JSON.parse(fs.readFileSync(path.join(RAIZ, 'estudio/marca.json'), 'utf8'));
const PASTA_PECAS = path.join(RAIZ, 'estudio/pecas');
const SAIDA = path.join(RAIZ, 'variacoes');

const TAM = { Story: [1080, 1920], 'Estático': [1080, 1350], Carrossel: [1080, 1350] };
const PREFIXO = { Story: 'STORY', 'Estático': 'ESTATICO', Carrossel: 'CARROSSEL' };

// ---------- tema por estilo ----------
function tema(estilo) {
  const c = marca.cores;
  if (estilo === 'escuro') return { bg: c.texto, fg: c.fundo, acento: c.acento, card: 'rgba(255,255,255,.07)', cardFg: c.fundo, sub: 'rgba(255,255,255,.72)', borda: 'rgba(255,255,255,.14)' };
  if (estilo === 'acento') return { bg: c.acento, fg: '#FFFFFF', acento: c.texto, card: '#FFFFFF', cardFg: c.texto, sub: 'rgba(255,255,255,.88)', borda: 'transparent' };
  if (estilo === 'apoio') return { bg: c.apoio, fg: '#FFFFFF', acento: c.acento, card: 'rgba(255,255,255,.1)', cardFg: '#FFFFFF', sub: 'rgba(255,255,255,.8)', borda: 'rgba(255,255,255,.18)' };
  return { bg: c.fundo, fg: c.texto, acento: c.acento, card: c.cartao, cardFg: c.texto, sub: 'rgba(27,31,36,.68)', borda: 'rgba(0,0,0,.06)' };
}

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// *palavra* = destaque na cor de acento; quebra de linha preservada
const rico = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

function logoHtml() {
  if (marca.logo && fs.existsSync(path.join(RAIZ, marca.logo))) {
    const svg = fs.readFileSync(path.join(RAIZ, marca.logo), 'utf8');
    return `<div class="logo">${svg}</div>`;
  }
  return `<div class="logo palavra">${esc(marca.nome)}</div>`;
}

// ---------- blocos de cartão ----------
function bloco(b) {
  if (!b) return '';
  if (b.tipo === 'lista') return `<div class="card"><ol class="lista">${b.itens.map((i) => `<li>${rico(i)}</li>`).join('')}</ol></div>`;
  if (b.tipo === 'checklist') return `<div class="card"><ul class="check">${b.itens.map((i) => `<li>${rico(i)}</li>`).join('')}</ul></div>`;
  if (b.tipo === 'numero') return `<div class="card numero"><div class="n">${esc(b.valor)}</div><div class="rot">${rico(b.rotulo)}</div>${b.fonte ? `<div class="fonte">${esc(b.fonte)}</div>` : ''}</div>`;
  if (b.tipo === 'comparacao') return `<div class="card"><div class="comp">${b.linhas.map((l) => `<div class="lin"><span>${rico(l[0])}</span><b>${rico(l[1])}</b></div>`).join('')}</div></div>`;
  if (b.tipo === 'duas_colunas') return `<div class="duas"><div class="card col"><div class="ct">${rico(b.esquerda.titulo)}</div>${b.esquerda.itens.map((i) => `<p>${rico(i)}</p>`).join('')}</div><div class="card col dest"><div class="ct">${rico(b.direita.titulo)}</div>${b.direita.itens.map((i) => `<p>${rico(i)}</p>`).join('')}</div></div>`;
  if (b.tipo === 'texto') return `<div class="card"><p class="txt">${rico(b.texto)}</p></div>`;
  if (b.tipo === 'citacao') return `<div class="card cit"><p>“${rico(b.texto)}”</p>${b.autor ? `<span>${esc(b.autor)}</span>` : ''}</div>`;
  return '';
}

function css(t, w, h, formato) {
  const story = formato === 'Story';
  const padTop = story ? 230 : 96, padBot = story ? 200 : 80, padX = story ? 96 : 84;
  return `
  @import url('${marca.fontes.google_fonts_url}');
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:${w}px;height:${h}px;overflow:hidden}
  body{background:${t.bg};color:${t.fg};font-family:'${marca.fontes.texto}',sans-serif;-webkit-font-smoothing:antialiased}
  .tela{position:relative;width:${w}px;height:${h}px;padding:${padTop}px ${padX}px ${padBot}px;display:flex;flex-direction:column}
  .conteudo{flex:1;display:flex;flex-direction:column;justify-content:center;gap:${story ? 44 : 34}px}
  .tag{display:inline-block;align-self:flex-start;font-weight:700;font-size:${story ? 30 : 26}px;letter-spacing:.08em;text-transform:uppercase;color:${t.acento};}
  .pilula{align-self:flex-start;background:${t.acento};color:${t.bg === marca.cores.acento ? '#fff' : t.bg};font-weight:700;font-size:28px;padding:12px 26px;border-radius:999px}
  h1{font-family:'${marca.fontes.titulo}',sans-serif;font-weight:800;font-size:${story ? 104 : 84}px;line-height:1.04;letter-spacing:-.025em}
  h1.menor{font-size:${story ? 86 : 70}px}
  h1 em, h2 em, .txt em, li em, .rot em, p em{font-style:normal;color:${t.acento}}
  .sub{font-size:${story ? 44 : 38}px;line-height:1.3;color:${t.sub};font-weight:500}
  .card{background:${t.card};color:${t.cardFg};border:1px solid ${t.borda};border-radius:36px;padding:${story ? 56 : 46}px;box-shadow:0 10px 30px rgba(0,0,0,.06)}
  .lista{list-style:none;counter-reset:n;display:flex;flex-direction:column;gap:28px}
  .lista li{counter-increment:n;display:flex;gap:26px;font-size:${story ? 42 : 38}px;line-height:1.3;font-weight:500}
  .lista li::before{content:counter(n);flex:0 0 64px;height:64px;border-radius:50%;background:${t.acento};color:#fff;font-weight:800;display:flex;align-items:center;justify-content:center;font-size:32px}
  .check{list-style:none;display:flex;flex-direction:column;gap:26px}
  .check li{font-size:${story ? 42 : 38}px;line-height:1.3;font-weight:500;padding-left:64px;position:relative}
  .check li::before{content:'✓';position:absolute;left:0;top:0;width:46px;height:46px;border-radius:12px;background:${t.acento};color:#fff;font-weight:800;font-size:28px;display:flex;align-items:center;justify-content:center}
  .numero{text-align:center}.numero .n{font-family:'${marca.fontes.titulo}';font-weight:800;font-size:180px;line-height:1;color:${t.acento};letter-spacing:-.04em}
  .numero .rot{font-size:40px;margin-top:18px;font-weight:600;line-height:1.3}.numero .fonte{font-size:24px;opacity:.6;margin-top:18px}
  .comp{display:flex;flex-direction:column}.lin{display:flex;justify-content:space-between;gap:24px;font-size:38px;padding:24px 0;border-bottom:2px dashed rgba(127,127,127,.25)}.lin:last-child{border:0}.lin b{color:${t.acento}}
  .duas{display:grid;grid-template-columns:1fr 1fr;gap:24px}.col .ct{font-weight:800;font-size:36px;margin-bottom:20px}.col p{font-size:32px;line-height:1.35;margin-bottom:14px}.col.dest{outline:4px solid ${t.acento}}
  .txt{font-size:${story ? 44 : 39}px;line-height:1.4;font-weight:500}
  .cit p{font-size:46px;line-height:1.35;font-weight:600}.cit span{display:block;margin-top:20px;font-size:28px;opacity:.7}
  .rodape{position:absolute;left:${padX}px;right:${padX}px;bottom:${story ? 150 : 56}px;display:flex;justify-content:space-between;align-items:center;font-size:26px;color:${t.sub}}
  .logo{height:56px;display:flex;align-items:center}.logo svg{height:56px;width:auto}.logo.palavra{font-family:'${marca.fontes.titulo}';font-weight:800;font-size:40px;color:${t.fg};letter-spacing:-.02em}
  .cont{font-weight:700;font-size:26px;color:${t.sub}}
  .neste{background:${t.card};color:${t.cardFg};border-radius:28px;padding:34px 40px;border:1px solid ${t.borda}}
  .neste b{display:block;font-size:24px;letter-spacing:.08em;text-transform:uppercase;color:${t.acento};margin-bottom:16px}
  .neste li{font-size:34px;line-height:1.45;list-style:none}.neste li::before{content:'→ ';color:${t.acento};font-weight:800}
  .arraste{align-self:flex-start;background:${t.fg};color:${t.bg};font-weight:700;font-size:30px;padding:18px 34px;border-radius:999px}
  .etapa{font-family:'${marca.fontes.titulo}';font-weight:800;font-size:120px;line-height:1;color:${t.acento};opacity:.9}
  h2{font-family:'${marca.fontes.titulo}';font-weight:800;font-size:66px;line-height:1.08;letter-spacing:-.02em}
  .corpo{font-size:40px;line-height:1.42;font-weight:500;text-align:center}
  .slide .conteudo{align-items:stretch}
  .final{align-items:center;text-align:center}.final .logo{height:90px}.final .logo.palavra{font-size:72px}
  .final h2{font-size:72px}.aviso{font-size:22px;opacity:.6;line-height:1.4}
  `;
}

function pagina(t, w, h, formato, corpo, contador) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${css(t, w, h, formato)}</style></head>
  <body><div class="tela">${corpo}<div class="rodape">${logoHtml()}<span class="cont">${contador || esc(marca.arroba)}</span></div></div></body></html>`;
}

// ---------- modelos ----------
function storyOuEstatico(v, formato) {
  return `<div class="conteudo">
    ${v.tag ? `<span class="tag">${esc(v.tag)}</span>` : ''}
    ${v.pilula ? `<span class="pilula">${esc(v.pilula)}</span>` : ''}
    <h1 class="${(v.titulo || '').length > 60 ? 'menor' : ''}">${rico(v.titulo)}</h1>
    ${v.subtitulo ? `<p class="sub">${rico(v.subtitulo)}</p>` : ''}
    ${bloco(v.cartao)}
  </div>`;
}

function carrosselPaginas(v) {
  const total = v.slides.length + 2;
  const capa = `<div class="conteudo">
    ${v.capa.tag ? `<span class="tag">${esc(v.capa.tag)}</span>` : ''}
    <h1 class="${(v.capa.titulo || '').length > 60 ? 'menor' : ''}">${rico(v.capa.titulo)}</h1>
    ${v.capa.subtitulo ? `<p class="sub">${rico(v.capa.subtitulo)}</p>` : ''}
    <div class="neste"><b>Neste carrossel</b><ul>${(v.capa.topicos || v.slides.map((s) => s.titulo)).map((x) => `<li>${rico(x)}</li>`).join('')}</ul></div>
    <span class="arraste">Arraste para o lado →</span>
  </div>`;
  const slides = v.slides.map((s, i) => `<div class="conteudo slide">
    <div class="etapa">${String(i + 1).padStart(2, '0')}</div>
    <h2>${rico(s.titulo)}</h2>
    ${s.texto ? `<p class="corpo">${rico(s.texto)}</p>` : ''}
    ${bloco(s.cartao)}
  </div>`);
  const f = v.final || {};
  const final = `<div class="conteudo final">
    ${logoHtml()}
    <h2>${rico(f.titulo || 'Salve para consultar depois')}</h2>
    ${f.texto ? `<p class="sub">${rico(f.texto)}</p>` : ''}
    <div class="card"><p class="txt">${rico(f.cta || 'Mande para alguém que precisa ver isso.\n*Link na bio.*')}</p></div>
    ${marca.aviso_legal ? `<p class="aviso">${esc(marca.aviso_legal)}</p>` : ''}
  </div>`;
  return [capa, ...slides, final].map((c, i) => ({ corpo: c, contador: `${i + 1}/${total}` }));
}

// ---------- render ----------
async function medir(page) {
  return page.evaluate(() => {
    const H = window.innerHeight;
    const rod = document.querySelector('.rodape').getBoundingClientRect();
    const blocos = [...document.querySelectorAll('.conteudo > *')];
    const ultimo = blocos.length ? Math.max(...blocos.map((b) => b.getBoundingClientRect().bottom)) : 0;
    const primeiro = blocos.length ? Math.min(...blocos.map((b) => b.getBoundingClientRect().top)) : 0;
    const p = [];
    if (rod.bottom > H) p.push('rodapé saiu da tela');
    if (rod.top - ultimo < 24) p.push(`texto encostando no rodapé (${Math.round(rod.top - ultimo)} px)`);
    if (primeiro < 0) p.push('texto saiu pelo topo');
    return p;
  });
}

const args = process.argv.slice(2);
const arquivos = fs.readdirSync(PASTA_PECAS).filter((f) => f.endsWith('.json') && !f.startsWith('_'))
  .filter((f) => !args.length || args.includes(f.replace('.json', '')));
if (!arquivos.length) { console.log('Nenhuma peça em estudio/pecas/.'); process.exit(0); }

const browser = await chromium.launch();
const problemas = [];
let total = 0;
for (const arq of arquivos) {
  const p = JSON.parse(fs.readFileSync(path.join(PASTA_PECAS, arq), 'utf8'));
  if (!TAM[p.formato]) { console.log(`[${p.id}] formato ${p.formato}: render automático só para Story, Estático e Carrossel (Reels é feito à parte).`); continue; }
  const [w, h] = TAM[p.formato];
  for (const [letra, v] of Object.entries(p.variacoes)) {
    const dir = path.join(SAIDA, p.id, letra);
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    const t = tema(v.estilo || 'claro');
    const paginas = p.formato === 'Carrossel' ? carrosselPaginas(v) : [{ corpo: storyOuEstatico(v, p.formato), contador: '' }];
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const [i, pg] of paginas.entries()) {
      await page.setContent(pagina(t, w, h, p.formato, pg.corpo, pg.contador), { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const nome = p.formato === 'Carrossel'
        ? `${PREFIXO[p.formato]}-${p.id}_${p.slug}_slide-${String(i + 1).padStart(2, '0')}.jpg`
        : `${PREFIXO[p.formato]}-${p.id}_${p.slug}.jpg`;
      await page.screenshot({ path: path.join(dir, nome), type: 'jpeg', quality: 92 });
      for (const x of await medir(page)) problemas.push(`[${p.id} ${letra}] ${nome}: ${x}`);
      total++;
    }
    fs.writeFileSync(path.join(dir, 'legenda.txt'), (v.legenda || '').trim() + '\n');
    await ctx.close();
  }
}
await browser.close();
galeria();
console.log(`${total} imagens geradas em variacoes/. Galeria: variacoes/index.html`);
if (problemas.length) { console.log(`\n❌ ${problemas.length} problema(s) de layout:`); problemas.forEach((x) => console.log('   ', x)); process.exit(1); }
console.log('✅ Nenhum texto estourado.');

function galeria() {
  const ids = fs.readdirSync(SAIDA).filter((d) => fs.statSync(path.join(SAIDA, d)).isDirectory()).sort();
  const blocos = ids.map((id) => {
    const meta = fs.existsSync(path.join(PASTA_PECAS, id + '.json')) ? JSON.parse(fs.readFileSync(path.join(PASTA_PECAS, id + '.json'), 'utf8')) : {};
    const cols = fs.readdirSync(path.join(SAIDA, id)).sort().map((letra) => {
      const d = path.join(SAIDA, id, letra);
      const imgs = fs.readdirSync(d).filter((f) => f.endsWith('.jpg')).sort();
      const leg = fs.existsSync(path.join(d, 'legenda.txt')) ? fs.readFileSync(path.join(d, 'legenda.txt'), 'utf8') : '';
      const v = (meta.variacoes || {})[letra] || {};
      return `<div class="var"><h3>Variação ${letra} <small>${esc(v.estilo || '')} · ${esc(v.hipotese || '')}</small></h3>
        <div class="imgs">${imgs.map((f) => `<img src="${id}/${letra}/${f}" loading="lazy">`).join('')}</div>
        <pre>${esc(leg)}</pre><code>python3 scripts/instagram.py aprovar ${id} ${letra}</code></div>`;
    }).join('');
    return `<section><h2>Peça ${id} · ${esc(meta.formato || '')} · ${esc(meta.tema || '')}</h2><div class="vars">${cols}</div></section>`;
  }).join('');
  fs.writeFileSync(path.join(SAIDA, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Variações · ${esc(marca.nome)}</title>
<style>body{font-family:system-ui;margin:24px;background:#f4f4f4;color:#111}section{background:#fff;border-radius:14px;padding:18px;margin-bottom:24px;box-shadow:0 1px 4px #0001}
.vars{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:18px}.imgs{display:flex;gap:8px;overflow-x:auto}.imgs img{height:300px;border-radius:8px;border:1px solid #ddd}
h3 small{font-weight:400;color:#666}pre{white-space:pre-wrap;font-size:13px;background:#fafafa;padding:10px;border-radius:8px;max-height:220px;overflow:auto}code{font-size:12px;background:#eef;padding:4px 6px;border-radius:6px}</style>
<h1>Variações para aprovação · ${esc(marca.nome)}</h1><p>Escolha uma variação por peça (ou peça ajuste). Comando de aprovação embaixo de cada uma.</p>${blocos}`);
}
