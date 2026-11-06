# Passo a passo · Instagram da Lotti no automático (2 semanas, 3 posts por dia)

Este guia adapta o [playbook original](playbook-original.md) para o nosso caso: **14 dias, 42 peças**, publicadas sozinhas pelo n8n na nuvem.

| Horário (Brasília) | O que sai |
|---|---|
| **10h** | Story |
| **12h** | Feed (carrossel, estático ou Reels, alternando) |
| **18h** | Feed (carrossel, estático ou Reels, alternando) |

Ciclo de 3 dias no feed: **A** = Carrossel 12h / Reels 18h · **B** = Estático 12h / Carrossel 18h · **C** = Reels 12h / Estático 18h.
Total das 2 semanas: **14 stories, 10 carrosséis, 9 Reels e 9 estáticos.**

```
VOCÊ (produção)                    GITHUB (este repositório)            n8n NA NUVEM
plano.csv + artes + legendas  ──►  lotti-instagram.json + posts/  ──►  10h · 12h · 18h:
python3 scripts/instagram.py       mídia servida pelo jsDelivr          lê o JSON, acha a peça,
calendario                                                              publica pela API da Meta,
                                                                        registra e manda e-mail
```

Ordem recomendada: **Etapas 1 a 3 (Meta) podem começar já**, em paralelo com a produção, porque a parte da Meta é a que mais demora.

---

## Etapa 0 · Instalar o básico no seu computador (uma vez)

1. **Git** e uma conta no GitHub (você já tem).
2. **Python 3.10+** (no Mac e no Linux já vem; no Windows, instale pelo python.org marcando "Add to PATH").
3. Opcional, mas recomendado: `pip install pillow` e o **ffmpeg** (para o script conferir tamanho das imagens e dos vídeos).
4. Clone o repositório:

```bash
git clone https://github.com/trindadeprobusiness-wq/Posts-Lotti---Redes-sociais.git
```

---

## Etapa 1 · Instagram profissional + Página do Facebook

1. No app do Instagram: **Configurações › Tipo de conta e ferramentas › Mudar para conta profissional** → escolha **Empresa** (ou Criador).
2. Crie (ou use) uma **Página do Facebook** da Lotti.
3. Na Página: **Configurações › Contas vinculadas › Instagram** → conecte a conta.

> Sem conta profissional vinculada a uma Página, a API de publicação não funciona.

## Etapa 2 · Meta Business (portfólio empresarial)

1. Acesse **business.facebook.com** e crie o portfólio da Lotti (se ainda não existir).
2. Em **Configurações › Contas › Páginas**, adicione a Página da Lotti.
3. Em **Configurações › Contas › Contas do Instagram**, adicione o @ da Lotti.

## Etapa 3 · App da Meta e token que não expira

1. Acesse **developers.facebook.com › Meus apps › Criar app**.
   - Tipo/caso de uso: **Empresa**, com o caso de uso de **gerenciar mensagens e conteúdo do Instagram**.
   - Vincule ao portfólio da Lotti.
2. Adicione as permissões: `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`, `business_management`.
3. **Configurações do app › Básico:** preencha
   - **URL da política de privacidade:** o link do arquivo [`PRIVACIDADE.md`](../PRIVACIDADE.md) neste repositório no GitHub (troque o `PREENCHER_EMAIL` antes);
   - ícone 1024×1024, categoria e e-mail de contato.
4. **Publique o app** (chave "Modo de desenvolvimento" → **Ao vivo / Live**).
   > ⚠️ Se pular isso, a API responde **"API access blocked"**.
5. No **business.facebook.com › Configurações › Usuários › Usuários do sistema**:
   - Crie um usuário do sistema do tipo **Admin**.
   - **Atribuir ativos:** o app, a Página e a conta do Instagram (controle total).
   - **Gerar token:** escolha o app, validade **Nunca expira**, marque as 5 permissões acima.
   - **Copie o token e cole direto no n8n (Etapa 7). Não mande por chat, e-mail ou WhatsApp.**
6. Descubra o **ig_user_id** (número da conta do Instagram na API). No **Graph API Explorer** (developers.facebook.com/tools/explorer), com o token, rode:

```
GET me/accounts?fields=name,instagram_business_account{id,username}
```

O número dentro de `instagram_business_account.id` é o `ig_user_id`. Anote (não é segredo).

> **Alternativa mais simples (sem Página do Facebook):** a Meta também oferece a "API do Instagram com login do Instagram" (`graph.instagram.com`, permissões `instagram_business_basic` e `instagram_business_content_publish`). Funciona, mas o token dura 60 dias e precisa ser renovado. Para rodar sozinho por meses, o caminho do Usuário do Sistema acima é o mais estável.

---

## Etapa 4 · Planejar as 2 semanas

1. Ajuste a data de início em [`config.json`](../config.json) → `"inicio"` (de preferência uma segunda-feira).
2. Gere a grade:

```bash
python3 scripts/instagram.py plano --forcar
```

3. Abra `conteudo/plano.csv` (Excel, Google Planilhas ou VS Code) e preencha, para cada uma das 42 linhas: **pilar, tema, gancho e CTA**. Não mexa em `id`, `data` e `horario`.
   - Pilares sugeridos: Educativo 35% · Produto na prática 25% · Prova e confiança 15% · Comunidade 15% · Conversão 10%.
   - Não repita formato + pilar no mesmo dia nem o mesmo tema na mesma semana.
   - **Story com enquete, quiz ou caixinha:** a API não publica stickers. Troque `periodo` dessa linha para `MANUAL` e escreva o sticker na coluna `sticker`. Ela aparece no e-mail das 10h para alguém postar pelo app.
   - **Data comemorativa precisa cair num formato específico?** Use `trocas_de_dia` no `config.json` (ex.: `{"5": 6, "6": 5}`) e rode `plano --forcar` de novo **antes** de preencher.

⏸️ **Aprovação 1:** alguém da Lotti aprova o plano.

## Etapa 5 · Produzir e guardar as peças

O comando `plano` já criou uma pasta por dia, cada uma com um `LEIA.txt` dizendo **exatamente o nome de cada arquivo**:

```
posts/
  Dia-01_2026-11-16/
    MANHA/   STORY-01_<assunto>.jpg
             CARROSSEL-02_<assunto>_slide-01.jpg … slide-NN.jpg
    TARDE/   REELS-03_<assunto>.mp4
  Dia-02_2026-11-17/
    MANHA/   STORY-04_<assunto>.jpg · ESTATICO-05_<assunto>.jpg
    TARDE/   CARROSSEL-06_<assunto>_slide-01.jpg …
```

`MANHA` = story das 10h + feed das 12h. `TARDE` = feed das 18h. O que importa no nome é o **prefixo com o id** (`CARROSSEL-02_`); o `<assunto>` é livre (sem espaços e sem acento, de preferência).

| Formato | Tamanho | Arquivo | Regras |
|---|---|---|---|
| Story | 1080×1920 | `.jpg` (ou `.mp4`) | nada importante nos ~200 px do topo e ~170 px de baixo |
| Estático | 1080×1350 | `.jpg` | margem lateral ≥ 72 px |
| Carrossel | 1080×1350 | `.jpg`, 2 a 10 slides | capa com "Neste carrossel", texto ≥ 37 px, final com CTA |
| Reels | 1080×1920, 30 fps | `.mp4` H.264 yuv420p + AAC | 15–30 s, < 20 MB, **sempre com faixa de áudio**, texto fora dos 250 px de baixo |

Regras inegociáveis: **nada de dados de clientes** (nome, telefone, CPF, saldo) em print ou vídeo; **nada inventado** (número, depoimento, resultado); **nada copiado** de terceiros. **PNG não serve:** a API só aceita JPEG.

Precisa de um Reels com silêncio no áudio? Exemplo com ffmpeg:

```bash
ffmpeg -i entrada.mp4 -f lavfi -i anullsrc=r=44100:cl=stereo -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac saida.mp4
```

## Etapa 6 · Legendas

Cada post de feed tem um arquivo `conteudo/legendas/<id>.txt` (ex.: `02.txt`). Story não tem legenda pela API: o texto vai na arte.

```
Gancho na 1ª linha (até ~90 caracteres, aparece antes do "mais")

2 a 4 parágrafos curtos, uma ideia por parágrafo.

Um CTA só: salve / comente X / mande para alguém / link na bio

#hashtag1 #hashtag2 #hashtag3
```

Evite cara de IA: nada de "Descubra", "No mundo de hoje", "jornada", "transforme sua vida", emoji em toda linha. Leia em voz alta.

## Etapa 7 · Aprovar, gerar o calendário e revisar

1. Gere a galeria e revise peça por peça:

```bash
python3 scripts/instagram.py galeria
```

Abra `galeria.html` no navegador.

2. Para cada peça aprovada, troque `status` no `plano.csv` de `rascunho` para **`pronto_para_postar`**. Só essas são publicadas.
3. Gere o calendário (ele também valida tudo):

```bash
python3 scripts/instagram.py calendario
```

Se aparecer **❌**, corrija e rode de novo. O resultado tem que terminar em **✅**.

⏸️ **Aprovação 2:** galeria aprovada.

## Etapa 8 · Publicar no GitHub (o repositório precisa ser público)

A Meta baixa as fotos e vídeos por link, então **o repositório tem que ser público**. Por isso ele guarda só os posts e nada interno (sem token, sem senha, sem dado de cliente).

1. GitHub › repositório › **Settings › General › Danger Zone › Change visibility › Public**.
2. A branch `main` precisa ter o conteúdo (o jsDelivr lê `@main`). Envie:

```bash
git add -A
```

```bash
git commit -m "Posts das semanas 1 e 2"
```

```bash
git push origin main
```

3. Teste todas as URLs públicas (tem que dar 100%):

```bash
python3 scripts/instagram.py urls
```

Links que o n8n vai usar:
- **JSON:** `https://raw.githubusercontent.com/trindadeprobusiness-wq/Posts-Lotti---Redes-sociais/main/lotti-instagram.json`
- **Base da mídia:** `https://cdn.jsdelivr.net/gh/trindadeprobusiness-wq/Posts-Lotti---Redes-sociais@main`

> Por que jsDelivr e não o "raw" do GitHub? O raw entrega MP4 como `application/octet-stream` e o Instagram recusa o Reels.

---

## Etapa 9 · Montar o publicador no n8n

### 9.1 Credenciais (no cofre do n8n, nunca no chat)
- **Facebook Graph API:** cole o token do Usuário do Sistema (Etapa 3.5).
- **Gmail** (OAuth2) para os e-mails de resumo e de alerta.

### 9.2 Data Table
Crie a tabela `instagram_publicacoes_lotti` com as colunas:
`peca_id, data, slot, ig_media_type, tema, resultado, ig_media_id, permalink, detalhe, executado_em`.
É ela que garante que **nenhum post sai duas vezes**.

### 9.3 Workflow `Instagram · Publicador Lotti`
Configurações do workflow: fuso **America/Sao_Paulo**, salvar execuções de sucesso e de erro, criado **desativado**.

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
              Container criado ─► Wait 15 s ─► Ver status ─► Pronto?
                    ├─ FINISHED ─► media_publish ─► Pegar permalink ─► Registrar "publicado"
                    ├─ IN_PROGRESS e tentativas < 16 ─► volta ao Wait (~4 min)
                    └─ erro ou tempo esgotado ─► Registrar "erro" ─► E-mail: post não saiu
[Error Trigger] ─► E-mail: falha no publicador (nó, erro, link da execução)
```

| Nó | Configuração |
|---|---|
| **Config** (Set) | `ig_user_id` = número da Etapa 3.6 · `json_url` = link do JSON · `midia_base_url` = base do jsDelivr · `email_alerta` · `data_forcada` (vazio) · `slot_forcado` (vazio) |
| **Purge jsDelivr** (HTTP GET) | a base trocando `cdn.jsdelivr.net` por `purge.jsdelivr.net`; "On Error: Continue". Sem isso, uma correção demora horas para valer. |
| **Baixar calendário** (HTTP GET) | `{{ $json.json_url }}?t={{ $now.toMillis() }}`, 3 tentativas |
| **Escolher peça do slot** (Code) | copie o arquivo [`n8n/escolher-peca-do-slot.js`](../n8n/escolher-peca-do-slot.js) |
| **Ainda não publicada?** (Data Table) | linha **não existe** com `peca_id` = X **e** `resultado` = `publicado` |
| **Criar container / item** (Facebook Graph API, POST `{ig_user_id}/media`) | parâmetros de `container_params` ou de cada item de `carrossel`; 3 tentativas |
| **Juntar slides** (Code) | confere se todos os itens foram criados e monta `{ media_type: 'CAROUSEL', children: 'id1,id2,…', caption }` |
| **Ver status** (GET `{creation_id}?fields=status_code,status`) | Switch: `FINISHED` publica; `IN_PROGRESS` e `$runIndex < 16` volta ao Wait |
| **Publicar** (POST `{ig_user_id}/media_publish`) | `creation_id` |
| **Pegar link** (GET `{media_id}?fields=id,permalink`) | "On Error: Continue" |

Deixe uma **nota adesiva** no canvas explicando como testar (próxima etapa).

> ✅ **Já criado:** o workflow **"Instagram · Publicador Lotti"** está no n8n (desligado), com fuso America/Sao_Paulo, usando as credenciais "Facebook Graph account" e "Gmail account" e a tabela própria `instagram_publicacoes_lotti`.
> **Falta só:** trocar `ig_user_id` no nó **Config** pelo número da conta da Lotti (Etapa 3.6). Enquanto estiver `PREENCHER...`, o workflow para com erro de propósito e não publica nada.

---

## Etapa 10 · Testes (antes de ligar)

| # | Teste | Como | Esperado |
|---|---|---|---|
| 1 | API responde | GET `{ig_user_id}?fields=username,media_count` | volta o @ da Lotti ("API access blocked" = app não publicado) |
| 2 | Mídias | `python3 scripts/instagram.py urls` | 100% ok |
| 3 | Escolha da peça | no Config, `data_forcada` = uma data do plano e `slot_forcado` = `10:00`, `12:00`, `18:00`; rode só até o Code | parâmetros corretos para story, carrossel e Reels |
| 4 | Peça não aprovada | uma peça com `rascunho` | registra "pulado" e manda e-mail |
| 5 | Publicação real (**com autorização**) | Teste manual numa peça aprovada | post no ar + linha "publicado" na Data Table |
| 6 | Não duplicar | rodar o teste 5 de novo | nada é publicado |
| 7 | Alerta | URL inválida numa cópia do workflow | e-mail de falha com link da execução |

Depois: **esvazie `data_forcada` e `slot_forcado`**, **ative o workflow** e acompanhe as 3 primeiras execuções (10h, 12h e 18h do dia 1).

---

## Etapa 11 · Durante as 2 semanas

| Quando | O quê |
|---|---|
| Todo dia, 10h | Ler o e-mail com a programação e postar os stories `MANUAL` pelo app |
| Chegou alerta | Corrigir, dar push e rodar o Teste manual com `data_forcada`/`slot_forcado` |
| Trocar ou adiar um post | Editar `status`, `data` ou legenda → `python3 scripts/instagram.py calendario` → push. O n8n relê o JSON a cada horário. |
| Dia 10 | Olhar métricas (salvamentos, compartilhamentos, alcance por formato) e começar o plano das próximas 2 semanas |
| Dia 12 | Produzir o próximo ciclo: mude `inicio` no `config.json` e rode `plano --forcar` |

**Para pausar tudo de uma vez:** desative o workflow no n8n. **Para pausar uma peça:** `status` = `pausado`.

---

## Se forem várias contas de Instagram

Cada conta precisa de: estar no mesmo portfólio do Meta Business, ser atribuída ao Usuário do Sistema (o mesmo token pode servir para todas) e ter o seu próprio `ig_user_id`.

No repositório: um `config.json` e um `<slug>-instagram.json` por conta (o caminho mais limpo é um repositório por conta, copiando este). No n8n: duplique o workflow e troque só o nó **Config** (`ig_user_id`, `json_url`, `midia_base_url`) e o nome da Data Table.

---

## Erros comuns

| Mensagem / sintoma | Causa | Solução |
|---|---|---|
| `API access blocked` | app da Meta em modo desenvolvimento | publicar o app (Live) com URL de privacidade |
| `(#10) Application does not have permission` | falta permissão no token | gerar token de novo com as 5 permissões |
| `Media ID is not available` / status `ERROR` | vídeo fora da especificação ou URL inválida | conferir com `ffprobe`, H.264/AAC, com áudio |
| `Only photo or video can be accepted` | PNG ou URL que não é mídia | usar JPEG e o link do jsDelivr |
| Correção no repositório não "pegou" | cache do jsDelivr | o nó Purge resolve; ou espere ~12 h |
| Post não saiu e nenhum e-mail | workflow desativado ou fuso errado | conferir se está ativo e o fuso `America/Sao_Paulo` |
