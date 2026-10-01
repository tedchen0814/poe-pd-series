"""Build the PoE PD teaching pages from shell.html + <page>.part.html.

Usage: python build.py
  - ../PoE-<STEM>_互動教學.html : single-file pages (everything inline, usable as a Claude Artifact)
  - ../_site/                   : static site for Vercel — index.html + one page per topic,
                                  sharing assets/series.css and assets/common.js
"""
import re
from pathlib import Path

SRC = Path(__file__).parent
OUT = SRC.parent
SITE = OUT / "_site"
DCDC = "https://dcdc-topology-series.vercel.app/"
SERIES = [  # (key, number, nav name, zh, single-file stem, site file)
    ("arch", "01", "ARCHITECTURE", "架構總覽", "01-ARCH", "architecture.html"),
    ("handshake", "02", "HANDSHAKE", "握手狀態機", "02-HANDSHAKE", "handshake.html"),
    ("budget", "03", "POWER BUDGET", "功率預算", "03-BUDGET", "power-budget.html"),
    ("topology", "04", "DC-DC", "拓撲選擇", "04-TOPOLOGY", "dcdc-topology.html"),
    ("pse", "05", "PSE", "供電端與預算", "05-PSE", "pse-switch.html"),
    ("lldp", "06", "LLDP", "功率協商", "06-LLDP", "lldp.html"),
]


def parse_part(text):
    parts = re.split(r"^<!--#([A-Z0-9_]+)-->\s*$", text, flags=re.M)
    return {parts[i]: parts[i + 1].strip("\n") for i in range(1, len(parts), 2)}


def nav(current, site):
    items = ['<span class="lab">系列 Series</span>']
    home = "<b>HOME</b>系列首頁"
    if site:
        items.append(f'<span class="cur" aria-current="page">{home}</span>' if current == "home"
                     else f'<a href="./">{home}</a>')
    for key, no, name, zh, stem, site_file in SERIES:
        inner = f"<b>{no} {name}</b>{zh}"
        if key == current:
            items.append(f'<span class="cur" aria-current="page">{inner}</span>')
        elif site:
            items.append(f'<a href="{site_file}">{inner}</a>')
        else:
            items.append(f'<a href="PoE-{stem}_互動教學.html">{inner}</a>')
    items.append(f'<a href="{DCDC}" target="_blank" rel="noopener"><b>↗ DC-DC</b>拓撲系列</a>')
    items.append('<a href="https://multiphase-vrm-series.vercel.app/" target="_blank" rel="noopener"><b>↗ 多相 VRM</b>CPU 核心供電</a>')
    return "".join(items)


def squeeze(text):
    return "\n".join(line.strip() for line in text.splitlines() if line.strip()) + "\n"


def fill(template, fields):
    return re.sub(r"\{\{([A-Z0-9_]+)\}\}", lambda m: fields.get(m.group(1), ""), template)


def to_site(page):
    """Swap the inline shared CSS / helper script for assets/* and wrap in a full document."""
    head, body = page.split('<div class="wrap">', 1)
    head = re.sub(r"<style>.*?</style>", '<link rel="stylesheet" href="assets/series.css">', head, count=1, flags=re.S)
    head = re.sub(r"<style>\s*</style>", "", head)
    first = re.search(r"<script>.*?</script>", body, flags=re.S)
    body = body[:first.start()] + '<script src="assets/common.js"></script>' + body[first.end():]
    return ('<!doctype html>\n<html lang="zh-Hant">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + '</head>\n<body>\n<div class="wrap">' + body + "</body>\n</html>\n")


def main():
    shell = (SRC / "shell.html").read_text(encoding="utf-8-sig")
    css = (SRC / "series.css").read_text(encoding="utf-8-sig") + (SRC / "poe.css").read_text(encoding="utf-8-sig")
    common = (SRC / "common.js").read_text(encoding="utf-8-sig")
    (SITE / "assets").mkdir(parents=True, exist_ok=True)
    reset = "html{color-scheme:light}body{margin:0}img{max-width:100%}[hidden]{display:none!important}\n"
    (SITE / "assets" / "series.css").write_text(squeeze(reset + css), encoding="utf-8")
    (SITE / "assets" / "common.js").write_text(squeeze(common), encoding="utf-8")

    pages = [(k, no, stem, f) for k, no, _, _, stem, f in SERIES] + [("home", "", "00-HOME", "index.html")]
    for key, no, stem, site_file in pages:
        part = SRC / ("index.part.html" if key == "home" else f"{key}.part.html")
        if not part.exists():
            print("skip", part.name)
            continue
        fields = parse_part(part.read_text(encoding="utf-8-sig"))
        fields.update(CSS=css, COMMON=common,
                      EYEBROW="PoE PD Series" + (f" · {no}" if no else ""))
        fields["NAV"] = nav(key, site=False)
        single = fill(shell, fields)
        left = re.findall(r"\{\{[A-Z0-9_]+\}\}", single.replace(common, "").replace(css, ""))
        if left:
            raise SystemExit(f"{part.name}: unfilled {left}")
        (OUT / f"PoE-{stem}_互動教學.html").write_text(single, encoding="utf-8")
        fields["NAV"] = nav(key, site=True)
        (SITE / site_file).write_text(squeeze(to_site(fill(shell, fields))), encoding="utf-8")
        print("wrote", f"PoE-{stem}_互動教學.html", "and _site/" + site_file)
    for f in sorted(SITE.rglob("*")):
        if f.is_file():
            print(f"  {f.relative_to(SITE).as_posix():24s} {f.stat().st_size:>7,d} bytes")


if __name__ == "__main__":
    main()
