# Playbook · Automação de Instagram (e conteúdo automático) para qualquer empresa ou projeto

> Método testado em produção na Carteira em Dia: 90 peças por mês e 3 publicações por dia, publicadas sozinhas na nuvem, sem depender de computador ligado.
> Este arquivo é o modelo para repetir o processo em qualquer marca. Preencha a **Seção 1 (Ficha do projeto)** e siga as fases na ordem.
> Também pode ser colado inteiro como prompt num agente de código (Claude, Codex etc.): ele foi escrito para isso.

---

## Sumário

1. [Ficha do projeto (preencher)](#1-ficha-do-projeto-preencher)
2. [Regras inegociáveis](#2-regras-inegociáveis)
3. [Arquitetura](#3-arquitetura)
4. [Fase 1 · Diagnóstico e estratégia](#4-fase-1--diagnóstico-e-estratégia)
5. [Fase 2 · Plano de 30 dias](#5-fase-2--plano-de-30-dias)
6. [Fase 3 · Sistema visual e produção das artes](#6-fase-3--sistema-visual-e-produção-das-artes)
7. [Fase 4 · Reels](#7-fase-4--reels)
8. [Fase 5 · Legendas](#8-fase-5--legendas)
9. [Fase 6 · Repositório de mídia e calendário JSON](#9-fase-6--repositório-de-mídia-e-calendário-json)
10. [Fase 7 · Meta / Instagram](#10-fase-7--meta--instagram)
11. [Fase 8 · Publicador no n8n](#11-fase-8--publicador-no-n8n)
12. [Fase 9 · Testes e ativação](#12-fase-9--testes-e-ativação)
13. [Operação mensal](#13-operação-mensal)
14. [Lições aprendidas](#14-lições-aprendidas)
15. [Módulo opcional · Portal de notícias automatizado](#15-módulo-opcional--portal-de-notícias-automatizado)
16. [Checklists de entrega](#16-checklists-de-entrega)
17. [Mensagem-modelo para o time](#17-mensagem-modelo-para-o-time)

---

## 1. Ficha do projeto (preencher)

| Campo | Valor |
|---|---|
| Nome do projeto / empresa | `{{PROJETO}}` |
| Slug curto (sem espaço, minúsculas) | `{{slug}}` (ex.: `lotti`) |
| @ do Instagram | `{{@conta}}` |
| Segmento e o que vende | `{{segmento}}` |
| Público principal (quem, dor, desejo) | `{{publico}}` |
| Promessa central (1 frase) | `{{promessa}}` |
| Tom de voz (3 adjetivos + 1 "não somos") | `{{tom}}` |
| Cores (hex): fundo, texto, acento, apoio | `{{#..., #..., #..., #...}}` |
| Fontes (título / texto) | `{{fontes}}` |
| Logo (SVG de preferência) | `{{arquivo}}` |
| Site / link da bio | `{{url}}` |
| E-mail para alertas e para a política de privacidade | `{{email}}` |
| Data de início (de preferência uma segunda-feira) | `{{AAAA-MM-DD}}` |
| Horários de publicação (Brasília) | padrão `10:00` story · `12:00` feed · `18:00` feed |
| Material do produto (gravação de tela, fotos, prints) | `{{links}}` |
| Datas importantes do mês (lançamentos, feriados, campanhas) | `{{datas}}` |
| Assuntos proibidos ou sensíveis (jurídico, saúde, finanças, concorrentes) | `{{restricoes}}` |
| Quem aprova as peças | `{{aprovador}}` |

> **Regra:** levante numa única rodada tudo o que faltar na ficha e já comece pelo que der. Não trave o trabalho esperando um item só.

---

## 2. Regras inegociáveis

1. **Credenciais nunca no chat.** Token, senha e chave vão direto no cofre do n8n (ou da hospedagem). Se alguém colar no chat, troque a credencial: gere a nova, cole no n8n, teste, e só então revogue a antiga.
2. **Nada é publicado nem ativado sem aprovação humana.** A automação é montada desligada; quem liga é o responsável.
3. **Dados pessoais nunca aparecem em post.** Isso inclui nome, CPF, e-mail, telefone, saldo, endereço e qualquer informação de cliente. Vídeos e prints passam por desfoque forte (pixelização), conferido quadro a quadro.
4. **Nada inventado.** Sem números, clientes, depoimentos ou resultados fictícios apresentados como reais; exemplo tem que estar marcado como exemplo.
5. **Respeito a direitos.** Não copiar arte, logo, personagem ou texto de terceiros. Referências servem só de inspiração.
6. **Setores regulados** (finanças, saúde, jurídico): nada de promessa de resultado nem recomendação individual. Use aviso de "conteúdo informativo" quando couber.
7. **Honestidade de status.** Todo relatório separa o que foi **testado de verdade** do que foi **só preparado ou simulado**.

---

## 3. Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│ PRODUÇÃO (uma vez por mês, no agente de código)                     │
│  templates HTML ──► Playwright ──► JPEG (stories, estáticos, slides)│
│  gravação de tela ──► ffmpeg (corte, desfoque) ──► Reels de produto │
│  HTML render(t) ──► Playwright quadro a quadro ──► Reels animados   │
│  script gerador ──► {{slug}}-instagram.json (calendário + legendas) │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ git push (após aprovação)
┌───────────────────────────────▼─────────────────────────────────────┐
│ REPOSITÓRIO GITHUB PÚBLICO, só do Instagram                         │
│  {{slug}}-instagram.json · Dia-XX_AAAA-MM-DD/MANHA|TARDE/*.jpg|mp4  │
│  PRIVACIDADE.md · README.md                                         │
│  mídia servida pelo jsDelivr (MIME correto)                         │
└───────────────────────────────┬─────────────────────────────────────┘
                                │ lido a cada execução
┌───────────────────────────────▼─────────────────────────────────────┐
│ n8n NA NUVEM · "Instagram · Publicador {{PROJETO}}"                 │
│  10h · 12h · 18h ► acha a peça do horário ► já publicada? ►         │
│  cria container (Graph API) ► espera FINISHED ► publica ►           │
│  registra link (Data Table) ► e-mail de resumo e de alerta          │
└─────────────────────────────────────────────────────────────────────┘
```

**Por que esta arquitetura:**
- **Roda sem computador ligado:** o n8n na nuvem dispara sozinho.
- **Aprovar ou adiar é editar um campo** (`status`) no JSON, sem mexer no n8n.
- **Repositório separado do código do produto:** é público por necessidade (a Meta baixa a mídia por URL), então não pode expor nada interno.
- **jsDelivr, e não o raw do GitHub:** o raw serve MP4 como `application/octet-stream` e o Instagram recusa o Reels.
- **Registro numa Data Table:** é o que garante que nenhuma peça sai duas vezes.

---

## 4. Fase 1 · Diagnóstico e estratégia

**Entregável:** 1 página com:
- **Resumo da marca:** promessa, público, tom e diferenciais, tirados da ficha.
- **4 a 5 pilares de conteúdo** com peso no mês. Sugestão de partida:

| Pilar | Peso | Exemplos |
|---|---|---|
| Educativo (resolve dúvida do público) | 35% | "3 erros ao…", "X vs Y", glossário |
| Produto na prática | 25% | tour, funcionalidade, "como fazer em 30 s" |
| Prova e confiança (sem inventar) | 15% | bastidores, processo, números reais autorizados |
| Comunidade / identificação | 15% | POV, mitos, perguntas, memes da área |
| Conversão leve | 10% | CTA para o link da bio, oferta, lançamento |

- **Objetivos do mês e métricas:** alcance, salvamentos, compartilhamentos, cliques no link e seguidores.
- **Lista do que NÃO falar:** tirada das restrições da ficha.

⏸️ **Aprovação 1:** estratégia.

---

## 5. Fase 2 · Plano de 30 dias

### 5.1 Grade
- **10h · Story** (1080×1920).
- **12h e 18h · Feed**, em ciclo de 3 dias:

| Dia do ciclo | 12h | 18h |
|---|---|---|
| A | Carrossel | Reels |
| B | Estático | Carrossel |
| C | Reels | Estático |

- **Total por mês:** 30 stories, 20 carrosséis, 20 Reels e 20 estáticos, ou seja, **90 peças**.
- A grade é ajustável na ficha (ex.: 2 posts por dia, ou feed só às 18h). O gerador do JSON lê a grade de uma constante.

### 5.2 Regras do plano
- **Datas amarradas:** a peça de uma data comemorativa, de um lançamento ou "de fim de semana" precisa cair no dia certo. Se o ciclo empurrar para o dia errado, **troque a ordem** no script (ex.: `CAL = {18: 20, 20: 18}`) e registre o motivo.
- **Stories interativos** (enquete, quiz, caixinha, slider) não funcionam pela API. Marque como `MANUAL`: eles entram no e-mail das 10h para alguém postar pelo app. A maioria dos stories deve ser arte publicável pela API.
- **Variedade:** não repita formato e pilar no mesmo dia, e não repita o mesmo tema na mesma semana.

### 5.3 Entregável
Tabela com as 90 linhas: `id · dia · data · dia da semana · horário · formato · pilar · tema · gancho · CTA`.

⏸️ **Aprovação 2:** plano do mês.

---

## 6. Fase 3 · Sistema visual e produção das artes

### 6.1 Ferramentas
- **Render:** Playwright (Chromium headless) carregando HTML/CSS local e salvando em JPEG com qualidade 92.
  - Use caminho absoluto (`file:///...`).
  - Espere `document.fonts.ready` antes de capturar.
- **Organização do código** (Python ou Node):

```
build/
 ├─ brand.(py|ts)        # tokens: cores, fontes, logo SVG, header(), footer(), page()
 ├─ templates.(py|ts)    # story(), static(), carousel() → HTML
 ├─ render.(py|ts)       # Renderer: abre o Chromium uma vez e gera vários JPEGs
 ├─ content_*.py         # textos de cada peça (dados, não layout)
 ├─ product_reels.py     # cortes e desfoques da gravação de tela
 ├─ motion_reels.py      # animações render(t)
 └─ build_all.py         # gera tudo + JSON + relatório de problemas
```

> Conteúdo separado do layout: os textos ficam em `content_*.py` e o visual em `templates`. No mês seguinte, só troca o conteúdo.

### 6.2 Tamanhos e áreas seguras

| Formato | Tamanho | Área segura |
|---|---|---|
| Story | 1080×1920 | ~200 px no topo e ~170 px embaixo sem texto importante |
| Estático / carrossel | 1080×1350 (4:5) | margem lateral ≥ 72 px |
| Reels | 1080×1920, 30 fps | texto fora dos 250 px de baixo (legenda e botões do app) |

### 6.3 Modelos
- **Story:** tag do tema → pílula opcional → título grande com uma palavra em cor de acento → subtítulo → **cartão** com o conteúdo → selo de "check" opcional → rodapé com a marca.
- **Estático:** a mesma linguagem, mais compacta.
- **Carrossel** (capa + 4 a 8 slides + final):
  - **Capa:** título forte, subtítulo, **caixa "Neste carrossel" listando os tópicos**, botão "Arraste para o lado →" e contador `1/N`.
  - **Slides:** número da etapa (`01`, `02`…), título, **texto grande e centralizado (corpo ≥ 37 px)**, cartão opcional e contador.
  - **Final:** logo, CTA ("Salve para consultar depois" / "Mande para alguém que precisa"), cartão "Link na bio", aviso legal se couber e contador `N/N`.
- **Blocos de cartão reutilizáveis:** lista numerada, número grande com rótulo, linhas de comparação (rótulo → valor), duas colunas (antes/depois, X vs Y), gráfico de barras em SVG, rosca em SVG e print do produto.

### 6.4 Controle de qualidade automático
- **Detector de estouro:** depois de cada render, meça no navegador o espaço entre o último bloco e o rodapé, e se o rodapé saiu da tela. Se o espaço for menor que 24 px, a peça vai para o relatório de problemas. **O relatório tem que terminar vazio.**
- **Galeria de revisão:** um HTML com as miniaturas das 90 peças por dia (formato, tema e status). É nela que o aprovador revisa.

⏸️ **Aprovação 3:** galeria. Ajuste o que for pedido e gere de novo.

---

## 7. Fase 4 · Reels

**Especificação:** 1080×1920, 30 fps, H.264 `yuv420p`, AAC, de 15 a 30 s, < 20 MB. Confira cada arquivo com `ffprobe`.

### 7.1 Reels de produto (a partir da gravação de tela)
1. Mapeie a gravação e anote os trechos úteis e onde aparecem dados pessoais (`SEGS` com início e fim; `STILLS` com retângulos a desfocar).
2. **Corte** com ffmpeg e **enquadre** a tela numa janela de cantos arredondados (máscara alpha) sobre o fundo da marca, com uma legenda curta no topo.
3. **Desfoque por pixelização** (`scale` para baixo e para cima) nas áreas sensíveis. O `boxblur` falhou com erro de raio de croma.
4. **Atenção a dados que escapam:** rolagem de tela e tooltip revelam valores por frações de segundo. Se não der para cobrir, encurte o trecho ou troque por uma tela sem dados.
5. Transições `xfade` entre as cenas e um card final com CTA.

### 7.2 Reels animados (motion)
- Uma página HTML/JS com `render(t)` desenha o quadro no tempo `t`. O Playwright captura a 30 fps e o ffmpeg junta os quadros.
- Formatos que funcionam: "3 erros", "X vs Y", "POV", "mito ou verdade", contagem regressiva, número que cresce, lista que aparece item a item.

### 7.3 Áudio
- Todo Reels sai **com faixa de áudio**, nem que seja silenciosa (`-f lavfi -i anullsrc`). Sem faixa de áudio o processamento pode falhar.
- Música em alta só dá para colocar pelo app (direitos). Se a estratégia depender disso, marque o Reels como manual.

---

## 8. Fase 5 · Legendas

### 8.1 Estrutura
```
[Gancho na 1ª linha: até ~90 caracteres, aparece antes do "mais"]

[2 a 4 parágrafos curtos: uma ideia por parágrafo]

[1 CTA só: salve / comente X / mande para alguém / link na bio]

#hashtag1 #hashtag2 #hashtag3   (3 a 6, relevantes)
```

### 8.2 Escrita humanizada
- Escreva como a marca fala com uma pessoa, não como anúncio.
- **Evite:** "No mundo de hoje", "Descubra", "Vamos juntos", "jornada", "desbloqueie", "revolucionário", "transforme sua vida", emoji em toda linha, excesso de travessões e trincas de adjetivos.
- **Prefira:** número concreto (real), exemplo do dia a dia, pergunta que a pessoa já se fez.
- **Limites:** 2.200 caracteres e no máximo 30 hashtags (use 3 a 6). Story pela API não tem legenda: o texto vai na arte.
- Releia em voz alta. Se soa como robô, reescreva.

---

## 9. Fase 6 · Repositório de mídia e calendário JSON

### 9.1 Repositório
- **GitHub público, separado do produto:** `{{slug}}-instagram`.
- Estrutura:

```
{{slug}}-instagram.json
README.md
PRIVACIDADE.md
Dia-01_AAAA-MM-DD/
  MANHA/  STORY-01_<slug>.jpg
          CARROSSEL-02_<slug>_slide-01.jpg … slide-NN.jpg
  TARDE/  REELS-03_<slug>.mp4
Dia-02_AAAA-MM-DD/
  MANHA/  STORY-04_<slug>.jpg · ESTATICO-05_<slug>.jpg
  TARDE/  CARROSSEL-06_<slug>_slide-01.jpg …
```

`MANHA` guarda o story das 10h e o feed das 12h; `TARDE` guarda o feed das 18h.

- **URL pública da mídia:** `https://cdn.jsdelivr.net/gh/<usuario>/{{slug}}-instagram@main/<caminho>`.
- **URL do JSON:** `https://raw.githubusercontent.com/<usuario>/{{slug}}-instagram/main/{{slug}}-instagram.json`.

### 9.2 Esquema do calendário (gerado por script, nunca editado à mão em massa)

```json
{
  "projeto": "{{PROJETO}} · Instagram",
  "conta_instagram": "{{@conta}}",
  "periodo": { "inicio": "AAAA-MM-DD", "fim": "AAAA-MM-DD" },
  "fuso": "America/Sao_Paulo",
  "gerado_em": "ISO-8601",
  "horarios": { "story": "10:00", "feed_manha": "12:00", "feed_tarde": "18:00" },
  "total_pecas": 90,
  "posts": [
    {
      "id": "02",
      "data": "AAAA-MM-DD",
      "dia": 1,
      "dia_semana": "Segunda",
      "horario": "12:00",
      "publicar_em": "AAAA-MM-DDT12:00:00-03:00",
      "periodo": "Manhã",
      "tipo": "FEED",
      "formato": "Carrossel",
      "ig_media_type": "CAROUSEL",
      "tema": "3 erros ao …",
      "legenda": "texto completo…",
      "sticker": "Não se aplica",
      "status": "pronto_para_postar",
      "midias": [
        { "ordem": 1, "arquivo": "CARROSSEL-02_x_slide-01.jpg", "tipo": "imagem",
          "caminho_post": "Dia-01_AAAA-MM-DD/MANHA/CARROSSEL-02_x_slide-01.jpg", "url_publica": null }
      ]
    }
  ]
}
```

| Campo | Valores | Uso |
|---|---|---|
| `tipo` + `periodo` | STORY+Manhã = 10h · FEED+Manhã = 12h · FEED+Tarde = 18h · STORY+`MANUAL` = app | define o horário |
| `ig_media_type` | `STORIES` · `IMAGE` · `CAROUSEL` · `REELS` | define a chamada da API |
| `status` | `pronto_para_postar` · `rascunho` · `pausado` | só o primeiro é publicado |
| `url_publica` | `null` ou URL | se preenchida, substitui a URL montada pelo caminho |

### 9.3 Validação antes do push
- Todo `caminho_post` existe e nenhum arquivo passa de 50 MB (o ideal é menos de 20 MB).
- Carrossel com 2 a 10 itens, imagem sempre em JPEG e feed entre 4:5 e 1.91:1.
- Depois do push: teste por amostragem as URLs do jsDelivr (status 200, `content-type` `image/jpeg` e `video/mp4`), incluindo **todos** os MP4.
- `PRIVACIDADE.md`: o app é de uso interno para publicar na própria conta, não coleta dados de terceiros e guarda só o registro das publicações (data, ID e link), com e-mail de contato e prazo de resposta. A URL desse arquivo no GitHub vira a política de privacidade do app da Meta.

⏸️ **Aprovação 4:** antes do push, porque o repositório é público.

---

## 10. Fase 7 · Meta / Instagram

Executado pelo responsável da conta, com o passo a passo abaixo.

1. **Conta profissional:** no Instagram, em Configurações › Tipo de conta, escolha Empresa ou Criador.
2. **Página do Facebook vinculada** à conta do Instagram.
3. **Meta Business** (business.facebook.com): Página e Instagram no mesmo portfólio.
4. **App** em developers.facebook.com, do tipo **Empresa**, com o caso de uso de gerenciar conteúdo do Instagram.
5. **Permissões:** `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement` e `business_management`.
6. **Configurações › Básico:** preencha a URL da política de privacidade (o `PRIVACIDADE.md`), o ícone, a categoria e o e-mail. Depois **publique o app (Live)**.
   > ⚠️ Com o app sem publicar, a API responde **"API access blocked"**.
7. **Usuário do Sistema** (admin) no Business: atribua o app, a Página e o Instagram e gere um **token sem expiração** com as permissões.
8. **ig_user_id:** `GET /me/accounts?fields=instagram_business_account{id,username}`.
9. **n8n:** crie a credencial **Facebook Graph API** e cole o token **só ali**.
10. **Rotação do token:** gere o novo, troque no n8n, teste e só então revogue o antigo.

---

## 11. Fase 8 · Publicador no n8n

**Workflow:** `Instagram · Publicador {{PROJETO}}`, com fuso `America/Sao_Paulo` e salvando as execuções de erro e de sucesso.

### 11.1 Fluxo

```
[Schedule 0 10,12,18 * * *] ─┐
[Teste manual] ──────────────┴─► Config ─► Purge jsDelivr ─► Baixar calendário ─► Escolher peça do slot
        ├─► (slot 10h?) ─► E-mail: programação do dia
        └─► O que fazer?
              ├─ pular ─► Registrar "pulado" ─► E-mail: peça pulada
              └─ publicar ─► Ainda não publicada? (Data Table)
                    └─► É carrossel?
                          ├─ sim ─► Separar slides ─► Criar item (×N) ─► Juntar slides ─► Criar container CAROUSEL ─┐
                          └─ não ─► Criar container (IMAGE / STORIES / REELS) ──────────────────────────────────────┤
                                                                                                                    ▼
              Container criado ─► Wait 15 s ─► Ver status ─► Pronto?
                    ├─ FINISHED ─► media_publish ─► Pegar permalink ─► Registrar "publicado"
                    ├─ IN_PROGRESS e tentativas < 16 ─► volta ao Wait (~4 min)
                    └─ erro ou tempo esgotado ─► Registrar "erro" ─► E-mail: post não saiu
[Error Trigger] ─► E-mail: falha no publicador (nó, erro, link da execução)
```

### 11.2 Nós principais

| Nó | Configuração |
|---|---|
| **Config** (Set) | `ig_user_id`, `json_url`, `midia_base_url`, `email_alerta`, `data_forcada` (vazio), `slot_forcado` (vazio) |
| **Purge jsDelivr** (HTTP) | GET na base trocando `cdn.jsdelivr.net` por `purge.jsdelivr.net`, com `onError: continue`. Sem isso, uma correção no repositório demora horas para valer. |
| **Baixar calendário** (HTTP) | GET `json_url?t={{$now.toMillis()}}`, 3 tentativas |
| **Escolher peça do slot** (Code) | ver 11.3 |
| **Ainda não publicada?** (Data Table) | `rowNotExists` com `peca_id` = X **e** `resultado` = `publicado` |
| **Criar container / item** (Facebook Graph API, POST `{ig_user_id}/media`) | parâmetros vindos do Code, 3 tentativas |
| **Ver status** (GET `{creation_id}?fields=status_code,status`) | loop pelo Switch com `$runIndex < 16` |
| **Publicar** (POST `{ig_user_id}/media_publish`) | `creation_id` |
| **Pegar link** (GET `{media_id}?fields=id,permalink`) | `onError: continue` |
| **Data Table** `instagram_publicacoes_{{slug}}` | `peca_id, data, slot, ig_media_type, tema, resultado, ig_media_id, permalink, detalhe, executado_em` |

### 11.3 Lógica do "Escolher peça do slot" (referência)

```js
const cfg = $('Config').first().json;
const cal = $input.first().json;
const agora = $now.setZone('America/Sao_Paulo');
const data = cfg.data_forcada || agora.toFormat('yyyy-MM-dd');
const h = agora.hour;
const slot = cfg.slot_forcado || (h < 11 ? '10:00' : h < 15 ? '12:00' : '18:00');
const slotDe = (p) => p.tipo === 'STORY' && p.periodo === 'Manhã' ? '10:00'
  : p.tipo === 'FEED' && p.periodo === 'Manhã' ? '12:00'
  : p.tipo === 'FEED' && p.periodo === 'Tarde' ? '18:00' : 'manual';
const base = String(cfg.midia_base_url).replace(/\/$/, '');
const urlDe = (m) => m.url_publica || base + '/' + m.caminho_post.split('/').map(encodeURIComponent).join('/');
const isVideo = (u) => /\.mp4($|\?)/i.test(u);
const doDia = (cal.posts || []).filter((p) => p.data === data);
const peca = doDia.find((p) => slotDe(p) === slot);
// resumo_html: lista do dia, destacando os itens MANUAL e o sticker de cada um (vai no e-mail das 10h)
if (!peca) return [{ json: { acao: 'nada', data, slot } }];
const urls = peca.midias.slice().sort((a, b) => a.ordem - b.ordem).map(urlDe);
const t = peca.ig_media_type;
const container_params =
  t === 'IMAGE' ? { image_url: urls[0], caption: peca.legenda } :
  t === 'REELS' ? { media_type: 'REELS', video_url: urls[0], caption: peca.legenda, share_to_feed: true } :
  t === 'STORIES' ? (isVideo(urls[0]) ? { media_type: 'STORIES', video_url: urls[0] } : { media_type: 'STORIES', image_url: urls[0] }) : null;
const carrossel = t === 'CAROUSEL' ? urls.slice(0, 10).map((u) => isVideo(u)
  ? { media_type: 'VIDEO', video_url: u, is_carousel_item: true } : { image_url: u, is_carousel_item: true }) : [];
const problemas = [];
if (peca.status !== 'pronto_para_postar') problemas.push('status ' + peca.status);
if (!urls.length) problemas.push('sem mídia');
if (t === 'CAROUSEL' && urls.length < 2) problemas.push('carrossel com menos de 2 slides');
return [{ json: { acao: problemas.length ? 'pular' : 'publicar', motivo: problemas.join('; '),
  data, slot, peca_id: peca.id, tipo: t, formato: peca.formato, tema: peca.tema, legenda: peca.legenda,
  urls, container_params, carrossel } }];
```

O nó **Juntar slides** confere se todos os itens foram criados e monta `{ media_type: 'CAROUSEL', children: 'id1,id2,…', caption }`.

### 11.4 Boas práticas no canvas
- Uma nota adesiva (sticky note) explicando o fluxo e **como testar** (`data_forcada` e `slot_forcado` + Teste manual; depois esvaziar os dois).
- Nós agrupados com nome: Escolher a peça · Criar o container · Esperar o Instagram · Publicar e registrar · Resumo do dia · Peça não aprovada · Container com erro · Alerta de falha.
- O workflow é criado **desativado**.

---

## 12. Fase 9 · Testes e ativação

| # | Teste | Como | Resultado esperado |
|---|---|---|---|
| 1 | Leitura da API | GET `{ig_user_id}?fields=username,media_count` | Retorna o @. "API access blocked" significa que o app não está publicado. |
| 2 | Mídias | todas as URLs do mês | 200 e MIME correto |
| 3 | Escolha da peça | Code com `data_forcada`/`slot_forcado` (story, carrossel, Reels), **sem publicar** | parâmetros corretos |
| 4 | Peça não aprovada | `status: rascunho` numa peça de teste | registra "pulado" e manda e-mail |
| 5 | Publicação real (**com autorização**) | Teste manual numa peça | post no ar e linha "publicado" na Data Table |
| 6 | Não duplicar | rodar o teste 5 de novo | nada é publicado |
| 7 | Alertas | forçar um erro (URL inválida numa cópia do workflow) | e-mail de falha com o link da execução |

Depois dos testes: esvaziar `data_forcada`/`slot_forcado` → **o responsável ativa** → acompanhar as 3 primeiras execuções.

**Relatório final:** o que foi executado de verdade, o que foi simulado e o que ficou pendente.

---

## 13. Operação mensal

| Quando | O quê |
|---|---|
| Dia 20 | Rever as métricas do mês (salvamentos, compartilhamentos, alcance por formato) e decidir o que repetir e o que cortar |
| Dia 22 | Plano do mês seguinte (Fase 2) → aprovação |
| Dia 25 | Gerar as artes, os Reels e o JSON (`build_all`) → galeria → aprovação |
| Dia 28 | Push no repositório e teste das URLs |
| Todo dia, 10h | Ler o e-mail de programação e postar os stories MANUAL |
| Quando chegar alerta | Corrigir e rodar o Teste manual com `data_forcada`/`slot_forcado` |
| A cada 60–90 dias | Rotacionar o token e revisar as permissões do app |

**Para adiar ou trocar uma peça:** edite `status`, `data` ou `legenda` no JSON. O publicador lê o arquivo de novo a cada horário.

---

## 14. Lições aprendidas

1. **jsDelivr para mídia, raw só para o JSON.** O raw serve MP4 com o MIME errado.
2. **Purge do jsDelivr a cada execução:** o `@main` fica em cache por horas.
3. **App da Meta precisa estar publicado** e com URL de privacidade, senão a resposta é "API access blocked".
4. **Dados pessoais escapam em rolagem e tooltip.** Revise o vídeo quadro a quadro e prefira telas com dados fictícios.
5. **Capa de carrossel sem a lista de tópicos parece vazia.** A caixa "Neste carrossel" resolve.
6. **Texto pequeno não se lê no celular:** corpo ≥ 37 px a 1080 de largura, centralizado nos slides.
7. **O detector de estouro evita texto cortado.** Inclua a altura do rodapé em relação à tela na medição.
8. **A Data Table de registro é a trava contra post duplicado.**
9. **O e-mail das 10h** com a programação evita surpresa e lembra dos stories manuais.
10. **Datas amarradas** (feriado, fim de semana) quebram o ciclo automático. Troque a ordem dos dias no script e documente.
11. **Credencial colada no chat = credencial comprometida.** Troque na hora.
12. **Separe conteúdo de layout:** é isso que faz o mês seguinte custar pouco.

---

## 15. Módulo opcional · Portal de notícias automatizado

Para marcas que querem um blog ou portal de notícias do setor alimentado sozinho (feito para a Carteira em Dia em `/noticias`).

- **Fluxo diário:**
  - **08h30:** coleta de feeds RSS/Atom (fontes oficiais, grande imprensa e veículos do setor) → curadoria (relevância, duplicatas, "em alta" = repercussão entre veículos) → redação com IA (texto próprio, JSON estrito) → verificação automática (todo número precisa existir na fonte, sem recomendação, sem cópia, sem instrução injetada) → agendamento.
  - **09h00:** publicação.
  - **09h20:** monitor.
- **Stack:** Next.js com `basePath` (servido por proxy no domínio da marca), PostgreSQL num schema próprio, n8n orquestrando por API com token de serviço, painel com aprovação humana, SEO (sitemap com Google News, JSON-LD NewsArticle, RSS, capas geradas).
- **Regras:**
  - O texto coletado é dado não confiável.
  - De veículos comerciais, usar só o título e um trecho curto como pauta, sempre com link para a original.
  - Modo **revisão** por padrão; o automático só vale para fato oficial ou confirmado por mais de um veículo.
  - Publicar menos em vez de inventar.
  - Checagem jurídica dos termos de uso das fontes comerciais antes de abrir ao público.
- **Testes mínimos:** dia normal, fonte fora do ar, todas fora, duplicata, poucas notícias, IA fora do ar, JSON inválido, número inventado, recomendação/injeção, reexecução idempotente.

---

## 16. Checklists de entrega

**Estratégia e conteúdo**
- [ ] Ficha do projeto completa
- [ ] Estratégia e pilares aprovados
- [ ] Plano de 90 peças aprovado
- [ ] Galeria aprovada e relatório de estouro vazio
- [ ] Reels conferidos (`ffprobe`, áudio, desfoque)
- [ ] Legendas revisadas (gancho, 1 CTA, 3–6 hashtags, sem vício de IA)

**Infraestrutura**
- [ ] Repositório público separado com JSON, mídias, README e PRIVACIDADE
- [ ] URLs do jsDelivr testadas (200 e MIME correto)
- [ ] App da Meta publicado, Usuário do Sistema criado e token só no n8n
- [ ] Credenciais Facebook Graph e Gmail no n8n
- [ ] Data Table criada
- [ ] Workflow importado, testado (testes 1 a 7) e **ativado pelo responsável**

**Documentação**
- [ ] Scripts versionados para gerar o próximo mês com um comando
- [ ] Relatório de testes: real vs. simulado
- [ ] Mensagem para o time enviada

---

## 17. Mensagem-modelo para o time

> Pessoal, o Instagram do **{{PROJETO}}** está no automático a partir de **{{data}}**.
>
> 📅 São 3 posts por dia: **10h** story, **12h** e **18h** feed (carrossel, estático ou Reels, alternando). O mês inteiro (90 peças) já está pronto e aprovado.
>
> ⚙️ Publica sozinho pela nuvem (n8n), sem depender de computador ligado. Nada sai duas vezes, e se algo falhar chega um e-mail na hora.
>
> ✋ Os stories com enquete ou quiz são postados à mão. Todo dia às 10h chega um e-mail com a programação.
>
> ✏️ Para trocar ou adiar um post, é só falar com **{{responsavel}}**.
>
> Qualquer ideia de conteúdo para o próximo mês, mandem por aqui até o dia 20. 🚀
