#!/usr/bin/env python3
"""
Ferramenta do repositório de posts do Instagram.

Comandos:
  python3 scripts/instagram.py plano        # cria a grade das 2 semanas, as pastas e os arquivos de legenda
  python3 scripts/instagram.py calendario   # lê plano + pastas + legendas e gera <slug>-instagram.json (com validação)
  python3 scripts/instagram.py urls         # depois do push: testa as URLs públicas (jsDelivr) de todas as mídias
  python3 scripts/instagram.py galeria      # gera galeria.html para revisar/aprovar as peças

Só usa a biblioteca padrão do Python. Pillow e ffprobe são usados se estiverem instalados
(para conferir tamanho das imagens e dos vídeos).
"""
import csv
import datetime as dt
import json
import re
import shutil
import subprocess
import sys
import urllib.parse
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CONFIG = json.loads((RAIZ / "config.json").read_text(encoding="utf-8"))
PLANO = RAIZ / "conteudo" / "plano.csv"
LEGENDAS = RAIZ / "conteudo" / "legendas"
POSTS = RAIZ / "posts"
SAIDA_JSON = RAIZ / f"{CONFIG['slug']}-instagram.json"

DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"]
COLUNAS = ["id", "dia", "data", "dia_semana", "horario", "tipo", "periodo", "formato",
           "ig_media_type", "pilar", "tema", "gancho", "cta", "sticker", "status"]
MEDIA_TYPE = {"Story": "STORIES", "Carrossel": "CAROUSEL", "Estático": "IMAGE", "Reels": "REELS"}
PREFIXO = {"Story": "STORY", "Carrossel": "CARROSSEL", "Estático": "ESTATICO", "Reels": "REELS"}
STATUS_VALIDOS = {"pronto_para_postar", "rascunho", "pausado"}
MB = 1024 * 1024


def pasta_do_dia(dia: int, data: str) -> Path:
    return POSTS / f"Dia-{dia:02d}_{data}"


def subpasta(horario: str) -> str:
    return "TARDE" if horario == CONFIG["horarios"]["feed_tarde"] else "MANHA"


# ---------------------------------------------------------------- plano
def cmd_plano(forcar: bool = False):
    if PLANO.exists() and not forcar:
        print(f"{PLANO.relative_to(RAIZ)} já existe. Nada foi sobrescrito (use --forcar para recriar).")
        criar_pastas(ler_plano())
        return
    inicio = dt.date.fromisoformat(CONFIG["inicio"])
    ciclo = CONFIG["ciclo"]
    trocas = {int(k): int(v) for k, v in CONFIG.get("trocas_de_dia", {}).items()}
    h = CONFIG["horarios"]
    linhas, n = [], 0
    for dia in range(1, CONFIG["dias"] + 1):
        data = inicio + dt.timedelta(days=dia - 1)
        base = {"dia": dia, "data": data.isoformat(), "dia_semana": DIAS_SEMANA[data.weekday()],
                "pilar": "", "tema": "", "gancho": "", "cta": "", "status": "rascunho"}
        grade = ciclo[(trocas.get(dia, dia) - 1) % len(ciclo)]
        itens = [(h["story"], "STORY", "Manhã", "Story"),
                 (h["feed_manha"], "FEED", "Manhã", grade["12:00"]),
                 (h["feed_tarde"], "FEED", "Tarde", grade["18:00"])]
        for horario, tipo, periodo, formato in itens:
            n += 1
            linhas.append({**base, "id": f"{n:02d}", "horario": horario, "tipo": tipo, "periodo": periodo,
                           "formato": formato, "ig_media_type": MEDIA_TYPE[formato],
                           "sticker": "Não se aplica"})
    PLANO.parent.mkdir(parents=True, exist_ok=True)
    with PLANO.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=COLUNAS, lineterminator="\n")
        w.writeheader()
        w.writerows(linhas)
    print(f"Plano criado: {len(linhas)} peças em {CONFIG['dias']} dias → {PLANO.relative_to(RAIZ)}")
    criar_pastas(linhas)


def ler_plano():
    if not PLANO.exists():
        sys.exit("Plano não encontrado. Rode primeiro: python3 scripts/instagram.py plano")
    with PLANO.open(encoding="utf-8") as f:
        return list(csv.DictReader(f))


def criar_pastas(linhas):
    LEGENDAS.mkdir(parents=True, exist_ok=True)
    por_pasta = {}
    for p in linhas:
        pasta = pasta_do_dia(int(p["dia"]), p["data"]) / subpasta(p["horario"])
        pasta.mkdir(parents=True, exist_ok=True)
        por_pasta.setdefault(pasta, []).append(p)
        leg = LEGENDAS / f"{p['id']}.txt"
        if p["tipo"] == "FEED" and not leg.exists():
            leg.write_text("", encoding="utf-8")
    for pasta, pecas in por_pasta.items():
        texto = ["Coloque aqui os arquivos destas peças, com estes nomes:", ""]
        for p in pecas:
            pre = f"{PREFIXO[p['formato']]}-{p['id']}_<assunto-curto>"
            if p["formato"] == "Carrossel":
                ex = f"{pre}_slide-01.jpg … {pre}_slide-NN.jpg  (2 a 10 slides, 1080x1350)"
            elif p["formato"] == "Reels":
                ex = f"{pre}.mp4  (1080x1920, 15–30 s, com faixa de áudio)"
            elif p["formato"] == "Story":
                ex = f"{pre}.jpg  (1080x1920)  ou .mp4"
            else:
                ex = f"{pre}.jpg  (1080x1350)"
            texto.append(f"{p['horario']} · {p['formato']:<9} · id {p['id']} → {ex}")
        (pasta / "LEIA.txt").write_text("\n".join(texto) + "\n", encoding="utf-8")
    print(f"Pastas prontas em {POSTS.relative_to(RAIZ)}/ e legendas em {LEGENDAS.relative_to(RAIZ)}/")


# ---------------------------------------------------------- calendário
def achar_midias(p):
    pasta = pasta_do_dia(int(p["dia"]), p["data"]) / subpasta(p["horario"])
    pre = f"{PREFIXO[p['formato']]}-{p['id']}_"
    arquivos = sorted(a for a in pasta.glob(pre + "*") if a.suffix.lower() in {".jpg", ".jpeg", ".mp4", ".png"})

    def ordem(a):
        m = re.search(r"slide-(\d+)", a.name)
        return int(m.group(1)) if m else 0
    return sorted(arquivos, key=ordem)


def url_publica(caminho: str) -> str:
    c = CONFIG
    partes = "/".join(urllib.parse.quote(x) for x in caminho.split("/"))
    return f"https://cdn.jsdelivr.net/gh/{c['github_usuario']}/{c['github_repo']}@{c['branch']}/{partes}"


def checar_midia(arq: Path, formato: str):
    avisos = []
    tam = arq.stat().st_size
    if tam > 50 * MB:
        avisos.append(f"{arq.name} tem {tam / MB:.1f} MB (máx. 50)")
    elif tam > 20 * MB:
        avisos.append(f"{arq.name} tem {tam / MB:.1f} MB (ideal < 20)")
    ext = arq.suffix.lower()
    if ext == ".png":
        avisos.append(f"{arq.name}: Instagram só aceita JPEG pela API, converta para .jpg")
    if formato == "Reels" and ext != ".mp4":
        avisos.append(f"{arq.name}: Reels precisa ser .mp4")
    if formato in ("Estático",) and ext == ".mp4":
        avisos.append(f"{arq.name}: estático precisa ser imagem")
    if ext in (".jpg", ".jpeg"):
        try:
            from PIL import Image
            with Image.open(arq) as im:
                w, h = im.size
            if formato == "Story" and (w, h) != (1080, 1920):
                avisos.append(f"{arq.name}: {w}x{h} (story ideal 1080x1920)")
            if formato in ("Estático", "Carrossel") and not (0.8 <= w / h <= 1.91):
                avisos.append(f"{arq.name}: proporção {w}x{h} fora do aceito no feed (4:5 a 1.91:1)")
        except ImportError:
            pass
    if ext == ".mp4" and shutil.which("ffprobe"):
        r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                            "stream=codec_type,codec_name,width,height,pix_fmt:format=duration",
                            "-of", "json", str(arq)], capture_output=True, text=True)
        try:
            info = json.loads(r.stdout)
            st = info.get("streams", [])
            v = next((s for s in st if s.get("codec_type") == "video"), {})
            if not any(s.get("codec_type") == "audio" for s in st):
                avisos.append(f"{arq.name}: sem faixa de áudio (adicione uma silenciosa)")
            if v.get("codec_name") != "h264" or v.get("pix_fmt") != "yuv420p":
                avisos.append(f"{arq.name}: vídeo {v.get('codec_name')}/{v.get('pix_fmt')} (use h264/yuv420p)")
            if (v.get("width"), v.get("height")) != (1080, 1920):
                avisos.append(f"{arq.name}: {v.get('width')}x{v.get('height')} (ideal 1080x1920)")
            dur = float(info.get("format", {}).get("duration", 0))
            if formato == "Reels" and not 3 <= dur <= 90:
                avisos.append(f"{arq.name}: duração {dur:.0f}s (Reels entre 3 e 90 s; ideal 15–30)")
        except (ValueError, StopIteration):
            avisos.append(f"{arq.name}: não consegui ler com ffprobe")
    return avisos


def checar_legenda(leg: str):
    avisos = []
    if len(leg) > 2200:
        avisos.append(f"legenda com {len(leg)} caracteres (máx. 2.200)")
    tags = re.findall(r"#\w+", leg)
    if len(tags) > 30:
        avisos.append(f"{len(tags)} hashtags (máx. 30)")
    elif leg and not 3 <= len(tags) <= 6:
        avisos.append(f"{len(tags)} hashtags (recomendado 3 a 6)")
    primeira = leg.strip().split("\n", 1)[0] if leg.strip() else ""
    if len(primeira) > 125:
        avisos.append("1ª linha (gancho) longa demais: fica escondida no 'mais'")
    return avisos


def cmd_calendario():
    plano = ler_plano()
    posts, erros, avisos = [], [], []
    for p in plano:
        pid, formato, status = p["id"], p["formato"], p["status"].strip()
        etiqueta = f"[{pid} · Dia {int(p['dia']):02d} {p['horario']} {formato}]"
        if status not in STATUS_VALIDOS:
            erros.append(f"{etiqueta} status '{status}' inválido (use {', '.join(sorted(STATUS_VALIDOS))})")
        arquivos = achar_midias(p)
        midias = []
        for i, a in enumerate(arquivos, 1):
            cam = a.relative_to(RAIZ).as_posix()
            midias.append({"ordem": i, "arquivo": a.name,
                           "tipo": "video" if a.suffix.lower() == ".mp4" else "imagem",
                           "caminho_post": cam, "url_publica": None})
        leg_arq = LEGENDAS / f"{pid}.txt"
        legenda = leg_arq.read_text(encoding="utf-8").strip() if leg_arq.exists() else ""

        problemas = []
        manual = p["periodo"].strip().upper() == "MANUAL"
        if not arquivos and not manual:
            problemas.append("sem mídia na pasta")
        if formato == "Carrossel" and arquivos and not 2 <= len(arquivos) <= 10:
            problemas.append(f"carrossel com {len(arquivos)} itens (precisa de 2 a 10)")
        if formato in ("Estático", "Reels", "Story") and len(arquivos) > 1:
            problemas.append(f"{len(arquivos)} arquivos encontrados; {formato} usa só 1")
        if p["tipo"] == "FEED" and not legenda:
            problemas.append("legenda vazia")
        for a in arquivos:
            problemas += checar_midia(a, formato)
        problemas += checar_legenda(legenda)

        if problemas:
            destino = erros if status == "pronto_para_postar" else avisos
            destino.append(f"{etiqueta} " + "; ".join(problemas))

        posts.append({
            "id": pid, "data": p["data"], "dia": int(p["dia"]), "dia_semana": p["dia_semana"],
            "horario": p["horario"],
            "publicar_em": f"{p['data']}T{p['horario']}:00{CONFIG['utc_offset']}",
            "periodo": p["periodo"], "tipo": p["tipo"], "formato": formato,
            "ig_media_type": MEDIA_TYPE[formato], "pilar": p["pilar"], "tema": p["tema"],
            "gancho": p["gancho"], "cta": p["cta"], "legenda": legenda,
            "sticker": p["sticker"] or "Não se aplica", "status": status, "midias": midias,
        })

    datas = [p["data"] for p in posts]
    cal = {
        "projeto": f"{CONFIG['projeto']} · Instagram",
        "conta_instagram": CONFIG["conta_instagram"],
        "periodo": {"inicio": min(datas), "fim": max(datas)},
        "fuso": CONFIG["fuso"],
        "gerado_em": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "horarios": CONFIG["horarios"],
        "midia_base_url": f"https://cdn.jsdelivr.net/gh/{CONFIG['github_usuario']}/{CONFIG['github_repo']}@{CONFIG['branch']}",
        "total_pecas": len(posts),
        "posts": posts,
    }
    SAIDA_JSON.write_text(json.dumps(cal, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    prontos = sum(p["status"] == "pronto_para_postar" for p in posts)
    print(f"Calendário gerado: {SAIDA_JSON.name} · {len(posts)} peças · {prontos} aprovadas (pronto_para_postar)")
    if avisos:
        print(f"\n⚠️  {len(avisos)} peça(s) em rascunho com pendências (não bloqueiam):")
        for a in avisos:
            print("   ", a)
    if erros:
        print(f"\n❌ {len(erros)} peça(s) APROVADA(S) com problema. Corrija antes do push:")
        for e in erros:
            print("   ", e)
        sys.exit(1)
    print("\n✅ Nenhum problema nas peças aprovadas.")


# ---------------------------------------------------------------- urls
def cmd_urls():
    if not SAIDA_JSON.exists():
        sys.exit("Gere o calendário antes: python3 scripts/instagram.py calendario")
    cal = json.loads(SAIDA_JSON.read_text(encoding="utf-8"))
    falhas, total = 0, 0
    for p in cal["posts"]:
        for m in p["midias"]:
            total += 1
            url = m["url_publica"] or url_publica(m["caminho_post"])
            esperado = "video/mp4" if m["tipo"] == "video" else "image/jpeg"
            try:
                req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "instagram-repo-check"})
                with urllib.request.urlopen(req, timeout=30) as r:
                    ct = r.headers.get("content-type", "")
                    ok = r.status == 200 and ct.startswith(esperado)
                    linha = f"{r.status} {ct}"
            except Exception as e:  # noqa: BLE001
                ok, linha = False, str(e)
            if not ok:
                falhas += 1
                print(f"❌ [{p['id']}] {url} → {linha}")
    print(f"\n{total - falhas}/{total} URLs ok.")
    sys.exit(1 if falhas else 0)


# ------------------------------------------------------------- galeria
def cmd_galeria():
    plano = ler_plano()
    blocos, dia_atual = [], None
    for p in plano:
        if p["dia"] != dia_atual:
            if dia_atual is not None:
                blocos.append("</div>")
            dia_atual = p["dia"]
            blocos.append(f"<h2>Dia {int(p['dia']):02d} · {p['dia_semana']} {p['data']}</h2><div class='dia'>")
        thumbs = ""
        for a in achar_midias(p):
            rel = a.relative_to(RAIZ).as_posix()
            if a.suffix.lower() == ".mp4":
                thumbs += f"<video src='{rel}' controls muted></video>"
            else:
                thumbs += f"<img src='{rel}' loading='lazy'>"
        leg_arq = LEGENDAS / f"{p['id']}.txt"
        leg = leg_arq.read_text(encoding="utf-8") if leg_arq.exists() else ""
        cor = "ok" if p["status"] == "pronto_para_postar" else "pend"
        blocos.append(
            f"<div class='peca'><div class='topo'><b>{p['horario']}</b> {p['formato']} · id {p['id']} "
            f"<span class='{cor}'>{p['status']}</span></div><div class='tema'>{p['tema'] or '(sem tema)'}</div>"
            f"<div class='midias'>{thumbs or '<em>sem mídia</em>'}</div><pre>{leg}</pre></div>")
    blocos.append("</div>")
    html = f"""<!doctype html><meta charset="utf-8"><title>Galeria · {CONFIG['projeto']}</title>
<style>body{{font-family:system-ui;margin:24px;background:#f6f6f6}}h2{{margin-top:32px}}
.dia{{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}}
.peca{{background:#fff;border-radius:12px;padding:12px;box-shadow:0 1px 3px #0002}}
.midias{{display:flex;gap:6px;overflow-x:auto}}img,video{{height:220px;border-radius:6px}}
pre{{white-space:pre-wrap;font-size:12px;background:#fafafa;padding:8px;max-height:160px;overflow:auto}}
.ok{{color:#0a7a2f}}.pend{{color:#b25e00}}.tema{{margin:6px 0;font-weight:600}}</style>
<h1>Galeria de revisão · {CONFIG['projeto']}</h1>{''.join(blocos)}"""
    (RAIZ / "galeria.html").write_text(html, encoding="utf-8")
    print("Galeria gerada: galeria.html (abra no navegador)")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "plano":
        cmd_plano(forcar="--forcar" in sys.argv)
    elif cmd == "calendario":
        cmd_calendario()
    elif cmd == "urls":
        cmd_urls()
    elif cmd == "galeria":
        cmd_galeria()
    else:
        print(__doc__)
