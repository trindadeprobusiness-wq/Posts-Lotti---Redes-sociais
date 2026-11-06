# Posts Lotti · Instagram no automático

Repositório dos posts do Instagram da Lotti. Guarda as artes, os vídeos e o calendário (`lotti-instagram.json`) que o n8n lê para publicar sozinho **3 vezes por dia (10h story · 12h e 18h feed) durante 14 dias = 42 peças**.

> ⚠️ Este repositório é **público** (a Meta baixa a mídia por link). Nunca coloque aqui token, senha ou dado de cliente.

## Por onde começar

1. 📘 **[Passo a passo completo](docs/PASSO-A-PASSO.md)**: Meta, produção, GitHub, n8n, testes e operação.
2. 📝 [Ficha do projeto](docs/FICHA-DO-PROJETO.md): preencher primeiro.
3. 📚 [Playbook original](docs/playbook-original.md): o método completo de referência.

## Estrutura

```
config.json                 início, nº de dias, horários e ciclo de formatos
conteudo/plano.csv          as 42 peças: data, horário, formato, tema, status
conteudo/legendas/<id>.txt  legenda de cada post de feed
posts/Dia-XX_AAAA-MM-DD/    MANHA (10h + 12h) e TARDE (18h), com LEIA.txt dizendo os nomes dos arquivos
lotti-instagram.json        calendário gerado (o n8n lê este arquivo; não edite à mão)
n8n/                        código do nó "Escolher peça do slot"
scripts/instagram.py        plano · calendario · galeria · urls
PRIVACIDADE.md              política de privacidade usada no app da Meta
```

## Comandos

```bash
python3 scripts/instagram.py plano        # cria a grade, as pastas e as legendas vazias
```

```bash
python3 scripts/instagram.py galeria      # galeria.html para revisar as peças
```

```bash
python3 scripts/instagram.py calendario   # gera o JSON e valida tudo (tem que terminar em ✅)
```

```bash
python3 scripts/instagram.py urls         # depois do push: testa os links públicos
```

## Regras

- Só sai o que estiver com `status` = `pronto_para_postar` no `plano.csv`.
- Para adiar ou trocar um post: edite o `plano.csv` ou a legenda, rode `calendario` e dê push.
- Stories com enquete/quiz: `periodo` = `MANUAL` (vão no e-mail das 10h para postar pelo app).
