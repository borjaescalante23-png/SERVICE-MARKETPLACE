#!/usr/bin/env python3
"""Generate moody SVG placeholders for El Ciclista (slightly warmer / lighter
palette than v1; motifs that evoke the real local: bike wheel, handlebar,
traffic light, espresso martini glass, vintage bottles).
Client will replace these with real photos later.
"""
import os, math, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "assets" / "img"
ROOT.mkdir(parents=True, exist_ok=True)

P = {
    "bg":      "#181210",
    "bg2":     "#1F1714",
    "bg3":     "#2A1F19",
    "gold":    "#D8B458",   # un punto más claro y dorado
    "gold2":   "#A88536",
    "terra":   "#A24521",
    "terra2":  "#75301A",
    "cream":   "#F3E9CC",
    "cream2":  "#E2D2A8",
    "amber":   "#D9582B",
    "smoke":   "#3A302A",
    "brass":   "#C9A961",
}

def grain_filter(seed):
    return f'<filter id="g{seed}"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch" seed="{seed}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.16 0"/></filter>'

def wrap(w, h, body, seed=1, defs=""):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">
<defs>{grain_filter(seed)}<filter id="bl"><feGaussianBlur stdDeviation="55"/></filter>{defs}</defs>
{body}
<rect width="100%" height="100%" filter="url(#g{seed})" opacity="0.55"/>
</svg>'''

def wheel(cx, cy, r, color=P["cream2"], opacity=0.7, spokes=24):
    out = [f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="none" stroke="{color}" stroke-width="2" opacity="{opacity}"/>']
    out.append(f'<circle cx="{cx}" cy="{cy}" r="{r-12}" fill="none" stroke="{color}" stroke-width="0.6" opacity="{opacity*0.5}"/>')
    out.append(f'<circle cx="{cx}" cy="{cy}" r="14" fill="{P["bg"]}" stroke="{P["gold"]}" stroke-width="1.6" opacity="{opacity}"/>')
    for a in range(0, 360, 360//spokes):
        x2 = cx + r*math.cos(math.radians(a))
        y2 = cy + r*math.sin(math.radians(a))
        out.append(f'<line x1="{cx}" y1="{cy}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{color}" stroke-width="0.55" opacity="{opacity*0.7}"/>')
    return "".join(out)

def martini_glass(cx, cy, color=P["cream"], liquid=P["terra2"], scale=1.0):
    s = scale
    return f'''<g transform="translate({cx} {cy})" opacity="0.95">
<path d="M {-110*s} {-130*s} L {110*s} {-130*s} L {8*s} {30*s} L {8*s} {140*s} L {55*s} {155*s} L {-55*s} {155*s} L {-8*s} {140*s} L {-8*s} {30*s} Z"
      fill="none" stroke="{color}" stroke-width="1.4"/>
<path d="M {-92*s} {-120*s} L {92*s} {-120*s} L {7*s} {18*s} L {-7*s} {18*s} Z" fill="{liquid}" opacity="0.85"/>
<ellipse cx="0" cy="{-120*s}" rx="{94*s}" ry="6" fill="{color}" opacity="0.6"/>
<!-- crema espuma -->
<ellipse cx="0" cy="{-115*s}" rx="{86*s}" ry="4" fill="{P['cream']}" opacity="0.55"/>
<circle cx="{-15*s}" cy="{-108*s}" r="{3.5*s}" fill="{P['gold']}" opacity="0.85"/>
<circle cx="{12*s}"  cy="{-112*s}" r="{2.6*s}" fill="{P['gold']}" opacity="0.75"/>
<circle cx="{-2*s}"  cy="{-105*s}" r="{2.0*s}" fill="{P['gold']}" opacity="0.6"/>
</g>'''

def traffic_light(cx, cy):
    return f'''<g transform="translate({cx} {cy})" opacity="0.78">
<rect x="-22" y="-50" width="44" height="120" rx="8" fill="{P['bg3']}" stroke="{P['cream2']}" stroke-width="1.2"/>
<circle cx="0" cy="-26" r="11" fill="{P['terra']}" opacity="0.95"/>
<circle cx="0" cy="2"   r="11" fill="{P['gold']}" opacity="0.85"/>
<circle cx="0" cy="30"  r="11" fill="#2B6A3F" opacity="0.9"/>
<rect x="-3" y="-100" width="6" height="50" fill="{P['cream2']}"/>
</g>'''

def handlebar(cx, cy):
    return f'''<g transform="translate({cx} {cy})" opacity="0.8">
<path d="M -200 0 Q -180 -30 -150 -30 L 150 -30 Q 180 -30 200 0" fill="none" stroke="{P['cream2']}" stroke-width="6" stroke-linecap="round"/>
<rect x="-216" y="-2" width="32" height="14" rx="3" fill="{P['bg3']}" stroke="{P['cream2']}" stroke-width="1.2"/>
<rect x="184"  y="-2" width="32" height="14" rx="3" fill="{P['bg3']}" stroke="{P['cream2']}" stroke-width="1.2"/>
<line x1="0" y1="-30" x2="0" y2="60" stroke="{P['cream2']}" stroke-width="3"/>
</g>'''

def bottle(x, y, h, c1, c2, label=""):
    return f'''<g transform="translate({x} {y})" opacity="0.85">
<rect x="0" y="{int(h*0.18)}" width="46" height="{int(h*0.82)}" rx="3" fill="{c1}" stroke="{P['cream2']}" stroke-width="0.8"/>
<rect x="12" y="0" width="22" height="{int(h*0.18)+4}" fill="{c1}" stroke="{P['cream2']}" stroke-width="0.8"/>
<rect x="0" y="{int(h*0.46)}" width="46" height="{int(h*0.18)}" fill="{P['cream']}" opacity="0.85"/>
<text x="23" y="{int(h*0.58)}" font-family="serif" font-size="9" text-anchor="middle" fill="{P['bg']}" font-style="italic" letter-spacing="1">{label}</text>
</g>'''

# ============================================================
# HERO — composición editorial bar + copa
# ============================================================
def hero_bar():
    body = f'''
<rect width="1600" height="1000" fill="{P['bg']}"/>
<!-- glow cálido -->
<g opacity="0.85" filter="url(#bl)">
  <circle cx="1280" cy="240" r="280" fill="{P['terra']}" opacity="0.50"/>
  <circle cx="320"  cy="320" r="240" fill="{P['gold']}"  opacity="0.34"/>
  <circle cx="950"  cy="800" r="380" fill="{P['gold2']}" opacity="0.26"/>
  <ellipse cx="800" cy="540" rx="980" ry="120" fill="{P['terra2']}" opacity="0.30"/>
</g>
<!-- back wall: bottles -->
<g opacity="0.55">
{bottle(80, 320, 320, P['bg3'], P['bg3'], "GIN")}
{bottle(150, 350, 300, P['terra2'], P['terra2'], "")}
{bottle(220, 340, 310, P['bg3'], P['bg3'], "VERMUT")}
{bottle(295, 360, 290, P['gold2'], P['gold2'], "")}
{bottle(365, 330, 320, P['bg3'], P['bg3'], "")}
{bottle(1280, 320, 320, P['bg3'], P['bg3'], "")}
{bottle(1350, 350, 300, P['terra2'], P['terra2'], "BITTER")}
{bottle(1420, 340, 310, P['bg3'], P['bg3'], "")}
{bottle(1495, 360, 290, P['gold2'], P['gold2'], "")}
</g>
<!-- counter -->
<rect x="0" y="700" width="1600" height="300" fill="url(#cnt)"/>
<defs><linearGradient id="cnt" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="#3a2a22" stop-opacity="0.7"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.92"/>
</linearGradient></defs>
<!-- wheel as table on the right (subtle) -->
<g opacity="0.16">
{wheel(1380, 680, 200, P['cream2'], 1.0, 28)}
</g>
<!-- espresso martini glass front-center -->
<g transform="translate(800 560)">
{martini_glass(0, 0, P['cream'], "#2a120a", 1.05)}
</g>
<!-- vignette -->
<rect width="1600" height="1000" fill="url(#vig)"/>
<defs><radialGradient id="vig" cx="50%" cy="55%" r="78%">
  <stop offset="0" stop-color="#000" stop-opacity="0.0"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.78"/>
</radialGradient></defs>
'''
    return wrap(1600, 1000, body, seed=11)

# ============================================================
# LOCAL collage (3 photos) — bike wheel + bottles + DJ
# ============================================================
def local_wheel():
    body = f'''
<rect width="900" height="1100" fill="{P['bg2']}"/>
<g opacity="0.8" filter="url(#bl)">
  <circle cx="450" cy="380" r="280" fill="{P['gold']}" opacity="0.45"/>
  <circle cx="600" cy="800" r="220" fill="{P['terra']}" opacity="0.40"/>
</g>
{wheel(450, 580, 290, P['cream2'], 0.85, 32)}
<rect width="900" height="1100" fill="url(#v1)"/>
<defs><radialGradient id="v1" cx="50%" cy="50%" r="78%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></radialGradient></defs>'''
    return wrap(900, 1100, body, seed=21)

def local_dj():
    body = f'''
<rect width="900" height="1100" fill="{P['bg2']}"/>
<g opacity="0.78" filter="url(#bl)">
  <circle cx="280" cy="320" r="240" fill="{P['amber']}" opacity="0.40"/>
  <circle cx="700" cy="780" r="280" fill="{P['gold2']}" opacity="0.35"/>
</g>
{traffic_light(450, 380)}
<!-- DJ booth desk -->
<rect x="160" y="780" width="580" height="220" fill="{P['bg3']}" opacity="0.85" stroke="{P['cream2']}" stroke-width="1"/>
<rect x="280" y="820" width="180" height="130" rx="4" fill="{P['bg']}" stroke="{P['cream2']}" stroke-width="1.2"/>
<rect x="490" y="820" width="180" height="130" rx="4" fill="{P['bg']}" stroke="{P['cream2']}" stroke-width="1.2"/>
<!-- vinyl on left deck -->
<circle cx="370" cy="885" r="48" fill="{P['bg']}" stroke="{P['cream2']}" stroke-width="0.8"/>
<circle cx="370" cy="885" r="10" fill="{P['gold']}"/>
<circle cx="580" cy="885" r="48" fill="{P['bg']}" stroke="{P['cream2']}" stroke-width="0.8"/>
<circle cx="580" cy="885" r="10" fill="{P['gold']}"/>
<rect width="900" height="1100" fill="url(#v2)"/>
<defs><radialGradient id="v2" cx="50%" cy="50%" r="78%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.74"/></radialGradient></defs>'''
    return wrap(900, 1100, body, seed=22)

def local_bar():
    body = f'''
<rect width="900" height="1100" fill="{P['bg2']}"/>
<g opacity="0.78" filter="url(#bl)">
  <circle cx="450" cy="350" r="280" fill="{P['gold']}" opacity="0.45"/>
  <circle cx="450" cy="900" r="320" fill="{P['terra2']}" opacity="0.35"/>
</g>
<!-- bottles -->
<g opacity="0.85">
{bottle(180, 380, 360, P['bg3'], P['bg3'], "GIN 1")}
{bottle(260, 410, 330, P['terra2'], P['terra2'], "GIN 2")}
{bottle(340, 380, 360, P['bg3'], P['bg3'], "GIN 3")}
{bottle(420, 410, 330, P['gold2'], P['gold2'], "GIN 4")}
{bottle(500, 380, 360, P['bg3'], P['bg3'], "GIN 5")}
{bottle(580, 410, 330, P['terra2'], P['terra2'], "GIN 6")}
{bottle(660, 380, 360, P['bg3'], P['bg3'], "GIN 7")}
</g>
<!-- bar counter -->
<rect x="0" y="820" width="900" height="280" fill="#2a1d17" opacity="0.85"/>
<!-- glass on bar -->
{martini_glass(450, 880, P['cream'], P['gold'], 0.55)}
<rect width="900" height="1100" fill="url(#v3)"/>
<defs><radialGradient id="v3" cx="50%" cy="50%" r="78%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.72"/></radialGradient></defs>'''
    return wrap(900, 1100, body, seed=23)

# ============================================================
# DETAIL TILES — editorial grid replacement for the marquee gallery
# ============================================================
def tile_wheel():
    body = f'''<rect width="900" height="900" fill="{P['bg2']}"/>
<g opacity="0.75" filter="url(#bl)"><circle cx="450" cy="450" r="320" fill="{P['gold']}" opacity="0.42"/></g>
{wheel(450, 450, 320, P['cream2'], 0.85, 32)}'''
    return wrap(900, 900, body, seed=31)

def tile_handlebar():
    body = f'''<rect width="900" height="900" fill="{P['bg2']}"/>
<g opacity="0.7" filter="url(#bl)"><circle cx="450" cy="450" r="280" fill="{P['terra']}" opacity="0.40"/></g>
<g transform="translate(450 450) scale(1.5)">{handlebar(0, 0)}</g>'''
    return wrap(900, 900, body, seed=32)

def tile_traffic():
    body = f'''<rect width="900" height="900" fill="{P['bg2']}"/>
<g opacity="0.7" filter="url(#bl)"><circle cx="450" cy="450" r="260" fill="{P['gold2']}" opacity="0.4"/></g>
<g transform="translate(450 450) scale(2.2)">{traffic_light(0, 0)}</g>'''
    return wrap(900, 900, body, seed=33)

def tile_bike():
    # silhouette of a road bike
    body = f'''<rect width="900" height="900" fill="{P['bg2']}"/>
<g opacity="0.7" filter="url(#bl)"><circle cx="450" cy="450" r="300" fill="{P['amber']}" opacity="0.35"/></g>
<g transform="translate(450 480)" opacity="0.85" stroke="{P['cream2']}" stroke-width="3" fill="none" stroke-linecap="round">
  <!-- wheels -->
  <circle cx="-180" cy="80" r="115"/>
  <circle cx="180"  cy="80" r="115"/>
  <!-- frame triangle -->
  <line x1="-180" y1="80" x2="-30" y2="-90"/>
  <line x1="-30" y1="-90" x2="120" y2="-90"/>
  <line x1="120" y1="-90" x2="180" y2="80"/>
  <line x1="-30" y1="-90" x2="50" y2="80"/>
  <line x1="50" y1="80" x2="180" y2="80"/>
  <line x1="50" y1="80" x2="-180" y2="80"/>
  <!-- seat post + saddle -->
  <line x1="50" y1="80" x2="80" y2="-110"/>
  <path d="M 40 -110 Q 80 -120 130 -110"/>
  <!-- handlebar -->
  <line x1="120" y1="-90" x2="200" y2="-140"/>
  <path d="M 180 -150 Q 220 -150 200 -110"/>
  <!-- pedal/spokes hint -->
  <circle cx="0" cy="80" r="18"/>
</g>'''
    return wrap(900, 900, body, seed=34)

def tile_counter():
    body = f'''<rect width="900" height="900" fill="{P['bg2']}"/>
<g opacity="0.75" filter="url(#bl)"><circle cx="450" cy="320" r="260" fill="{P['gold']}" opacity="0.40"/></g>
<rect x="0" y="540" width="900" height="360" fill="#2a1d17" opacity="0.92"/>
{martini_glass(310, 620, P['cream'], "#2a120a", 0.85)}
<g transform="translate(620 660)" opacity="0.85">
  <rect x="-30" y="-40" width="60" height="120" rx="3" fill="{P['terra2']}" stroke="{P['cream2']}" stroke-width="1"/>
  <rect x="-12" y="-70" width="24" height="35" fill="{P['terra2']}" stroke="{P['cream2']}" stroke-width="1"/>
</g>'''
    return wrap(900, 900, body, seed=35)

def tile_frame():
    # vintage portrait frame with EST. 2015
    body = f'''<rect width="900" height="900" fill="{P['bg2']}"/>
<g opacity="0.75" filter="url(#bl)"><circle cx="450" cy="450" r="280" fill="{P['terra2']}" opacity="0.40"/></g>
<rect x="180" y="180" width="540" height="540" fill="none" stroke="{P['gold']}" stroke-width="4"/>
<rect x="160" y="160" width="580" height="580" fill="none" stroke="{P['gold']}" stroke-width="1" opacity="0.55"/>
<g transform="translate(450 470)">
{wheel(0, 0, 160, P['cream2'], 0.7, 24)}
</g>
<text x="450" y="660" font-family="serif" font-size="34" font-style="italic" text-anchor="middle" fill="{P['cream']}" letter-spacing="6">EST · 2015 · BCN</text>'''
    return wrap(900, 900, body, seed=36)

# ============================================================
# CARTA art — single elegant glass + bike silhouette nested
# ============================================================
def carta_art():
    body = f'''
<rect width="900" height="1100" fill="{P['bg2']}"/>
<g opacity="0.85" filter="url(#bl)">
  <circle cx="450" cy="300" r="320" fill="{P['gold']}" opacity="0.48"/>
  <circle cx="500" cy="900" r="300" fill="{P['terra2']}" opacity="0.42"/>
</g>
<!-- big wheel halo -->
<g opacity="0.18">{wheel(450, 600, 360, P['cream2'], 1.0, 36)}</g>
<!-- glass front -->
{martini_glass(450, 580, P['cream'], "#2a120a", 1.4)}
<rect width="900" height="1100" fill="url(#cv)"/>
<defs><radialGradient id="cv" cx="50%" cy="50%" r="80%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.7"/></radialGradient></defs>'''
    return wrap(900, 1100, body, seed=41)

# ============================================================
# EVENTOS background (sigue siendo full-bleed)
# ============================================================
def event_bg():
    body = f'''
<rect width="1600" height="900" fill="{P['bg']}"/>
<g opacity="0.85" filter="url(#bl)">
  <circle cx="380"  cy="280" r="320" fill="{P['terra']}" opacity="0.55"/>
  <circle cx="1200" cy="640" r="380" fill="{P['gold2']}" opacity="0.45"/>
</g>
<g opacity="0.18">{wheel(220, 720, 240, P['cream2'], 1.0, 32)}</g>
<g opacity="0.55" transform="translate(0 540)">
  {''.join(f'<g transform="translate({i*210+200} 0)">{martini_glass(0, 0, P["cream"], [P["gold"], P["terra2"], P["amber"], P["gold2"]][i%4], 0.4)}</g>' for i in range(7))}
</g>
<rect width="1600" height="900" fill="url(#evg)"/>
<defs><radialGradient id="evg" cx="50%" cy="50%" r="78%"><stop offset="0" stop-color="#000" stop-opacity="0.15"/><stop offset="1" stop-color="#000" stop-opacity="0.82"/></radialGradient></defs>'''
    return wrap(1600, 900, body, seed=51)

# ============================================================
# GENERATE all
# ============================================================
# Clean up old gallery tiles
for old in ROOT.glob("gallery-*.svg"):
    old.unlink()

files = {
    "hero-bar.svg":       hero_bar(),
    "local-1.svg":        local_wheel(),
    "local-2.svg":        local_dj(),
    "local-3.svg":        local_bar(),
    "carta-art.svg":      carta_art(),
    "event-bg.svg":       event_bg(),
    "detail-wheel.svg":      tile_wheel(),
    "detail-handlebar.svg":  tile_handlebar(),
    "detail-trafficlight.svg": tile_traffic(),
    "detail-bike.svg":       tile_bike(),
    "detail-counter.svg":    tile_counter(),
    "detail-frame.svg":      tile_frame(),
}
for name, content in files.items():
    (ROOT / name).write_text(content, encoding="utf-8")
    print(f"wrote {name} ({len(content)//1024} KB)")

print(f"\nTotal {len(files)} files in {ROOT}")
