#!/usr/bin/env python3
"""Generate moody SVG placeholders for El Ciclista (dark warm bar imagery).
Client will replace these with real photos later. Each file is hand-shaped
so the gallery doesn't look algorithmic.
"""
import os, math, random
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "assets" / "img"
ROOT.mkdir(parents=True, exist_ok=True)

PALETTE = {
    "bg":      "#0E0B09",
    "bg2":     "#15110E",
    "bg3":     "#1E1813",
    "gold":    "#C49A3C",
    "gold2":   "#9B7926",
    "terra":   "#8B3A1A",
    "terra2":  "#6A2A11",
    "cream":   "#F2EBDA",
    "cream2":  "#DDD2BC",
    "amber":   "#cc4a26",
    "smoke":   "#3a302a",
}

def wrap(w, h, body, defs=""):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" preserveAspectRatio="xMidYMid slice">
<defs>
  <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" stitchTiles="stitch" seed="{random.randint(1,99)}"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.18 0"/></filter>
  <filter id="blur"><feGaussianBlur stdDeviation="60"/></filter>
  {defs}
</defs>
{body}
<rect width="100%" height="100%" filter="url(#grain)" opacity="0.55"/>
</svg>'''

def hero_bar(seed=1):
    random.seed(seed)
    body = f'''
<rect width="1600" height="1000" fill="{PALETTE['bg']}"/>
<g opacity="0.85" filter="url(#blur)">
  <circle cx="1240" cy="220" r="280" fill="{PALETTE['terra']}" opacity="0.45"/>
  <circle cx="320"  cy="320" r="220" fill="{PALETTE['gold']}"  opacity="0.30"/>
  <circle cx="900"  cy="780" r="340" fill="{PALETTE['gold2']}" opacity="0.22"/>
  <ellipse cx="800" cy="520" rx="900" ry="120" fill="{PALETTE['terra2']}" opacity="0.30"/>
</g>
<!-- counter line -->
<rect x="0" y="680" width="1600" height="320" fill="url(#counter)"/>
<defs><linearGradient id="counter" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0" stop-color="{PALETTE['smoke']}" stop-opacity="0.65"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.95"/>
</linearGradient></defs>
<!-- silhouette of bottles in background -->
<g opacity="0.55">
  <rect x="80"  y="380" width="38" height="280" fill="#1c1410"/>
  <rect x="78"  y="350" width="42" height="40"  fill="#1c1410"/>
  <rect x="150" y="400" width="32" height="260" fill="#231914"/>
  <rect x="148" y="378" width="36" height="30"  fill="#231914"/>
  <rect x="210" y="370" width="44" height="290" fill="#1c1410"/>
  <rect x="208" y="338" width="48" height="40"  fill="#1c1410"/>
  <rect x="1380" y="380" width="38" height="280" fill="#1c1410"/>
  <rect x="1378" y="350" width="42" height="40"  fill="#1c1410"/>
  <rect x="1450" y="400" width="32" height="260" fill="#231914"/>
  <rect x="1448" y="378" width="36" height="30"  fill="#231914"/>
</g>
<!-- cocktail glass center -->
<g transform="translate(800 540)" opacity="0.95">
  <path d="M -110 -120 L 110 -120 L 10 30 L 10 130 L 60 140 L -60 140 L -10 130 L -10 30 Z"
        fill="none" stroke="{PALETTE['cream2']}" stroke-width="1.2" opacity="0.55"/>
  <path d="M -90 -110 L 90 -110 L 8 18 L -8 18 Z" fill="{PALETTE['terra2']}" opacity="0.65"/>
  <ellipse cx="0" cy="-110" rx="92" ry="6" fill="{PALETTE['cream']}" opacity="0.35"/>
  <circle cx="-20" cy="-90" r="3" fill="{PALETTE['gold']}"/>
  <circle cx="14"  cy="-94" r="2.4" fill="{PALETTE['gold']}"/>
</g>
<!-- vignette -->
<rect width="1600" height="1000" fill="url(#vig)"/>
<defs><radialGradient id="vig" cx="50%" cy="50%" r="75%">
  <stop offset="0" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.78"/>
</radialGradient></defs>
'''
    return wrap(1600, 1000, body)

def local_collage(idx, seed):
    random.seed(seed)
    palettes = [
        (PALETTE['gold'],  PALETTE['terra2']),
        (PALETTE['terra'], PALETTE['gold2']),
        (PALETTE['amber'], PALETTE['terra2']),
    ]
    p1, p2 = palettes[idx % 3]
    body = f'''
<rect width="900" height="1100" fill="{PALETTE['bg2']}"/>
<g opacity="0.7" filter="url(#blur)">
  <circle cx="{random.randint(150,750)}" cy="{random.randint(200,500)}" r="240" fill="{p1}" opacity="0.55"/>
  <circle cx="{random.randint(150,750)}" cy="{random.randint(500,900)}" r="280" fill="{p2}" opacity="0.50"/>
</g>
<!-- bike wheel as recurring motif -->
<g transform="translate({random.randint(180,720)} {random.randint(380,700)}) rotate({random.randint(-20,20)})" opacity="0.55">
  <circle r="170" fill="none" stroke="{PALETTE['cream2']}" stroke-width="2"/>
  <circle r="156" fill="none" stroke="{PALETTE['cream2']}" stroke-width="0.6" opacity="0.55"/>
  <circle r="18"  fill="{PALETTE['bg']}" stroke="{PALETTE['gold']}" stroke-width="1.5"/>
  {''.join(f'<line x1="0" y1="0" x2="{170*math.cos(math.radians(a)):.1f}" y2="{170*math.sin(math.radians(a)):.1f}" stroke="{PALETTE["cream2"]}" stroke-width="0.6"/>' for a in range(0,360,18))}
</g>
<!-- glass silhouette -->
<g transform="translate({random.randint(220,680)} {random.randint(700,950)})" opacity="0.85">
  <path d="M -60 -90 L 60 -90 L 8 12 L 8 80 L 36 90 L -36 90 L -8 80 L -8 12 Z"
        fill="none" stroke="{PALETTE['cream']}" stroke-width="1.4"/>
  <path d="M -48 -82 L 48 -82 L 6 4 L -6 4 Z" fill="{p1}" opacity="0.78"/>
</g>
<rect width="900" height="1100" fill="url(#vig{idx})"/>
<defs><radialGradient id="vig{idx}" cx="50%" cy="50%" r="80%">
  <stop offset="0" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.7"/>
</radialGradient></defs>
'''
    return wrap(900, 1100, body)

def gallery_tile(idx, seed):
    random.seed(seed)
    motifs = ["wheel", "glass", "bottle", "neon", "bokeh", "smoke", "ice", "wood"]
    motif = motifs[idx % len(motifs)]
    palettes = [
        (PALETTE['gold'],  PALETTE['terra2']),
        (PALETTE['terra'], PALETTE['gold']),
        (PALETTE['amber'], PALETTE['gold2']),
        (PALETTE['gold2'], PALETTE['terra']),
        (PALETTE['cream2'], PALETTE['terra2']),
    ]
    p1, p2 = palettes[idx % 5]
    w, h = 800, 1000
    body_parts = [f'<rect width="{w}" height="{h}" fill="{PALETTE["bg2"]}"/>']
    # bokeh blobs
    body_parts.append('<g opacity="0.65" filter="url(#blur)">')
    for _ in range(3):
        body_parts.append(f'<circle cx="{random.randint(80,720)}" cy="{random.randint(80,920)}" r="{random.randint(110,240)}" fill="{random.choice([p1,p2,PALETTE["gold"]])}" opacity="{random.uniform(0.30,0.6):.2f}"/>')
    body_parts.append('</g>')

    if motif == "wheel":
        body_parts.append(f'''<g transform="translate({w//2} {h//2}) rotate({random.randint(-30,30)})" opacity="0.78">
  <circle r="220" fill="none" stroke="{PALETTE['cream2']}" stroke-width="2"/>
  <circle r="200" fill="none" stroke="{PALETTE['cream2']}" stroke-width="0.5" opacity="0.4"/>
  <circle r="20" fill="{PALETTE['bg']}" stroke="{PALETTE['gold']}" stroke-width="2"/>
  {''.join(f'<line x1="0" y1="0" x2="{220*math.cos(math.radians(a)):.1f}" y2="{220*math.sin(math.radians(a)):.1f}" stroke="{PALETTE["cream2"]}" stroke-width="0.6"/>' for a in range(0,360,15))}
</g>''')
    elif motif == "glass":
        body_parts.append(f'''<g transform="translate({w//2} {h//2 + 80})" opacity="0.92">
  <path d="M -160 -240 L 160 -240 L 14 20 L 14 200 L 70 220 L -70 220 L -14 200 L -14 20 Z"
        fill="none" stroke="{PALETTE['cream']}" stroke-width="1.6"/>
  <path d="M -140 -228 L 140 -228 L 12 0 L -12 0 Z" fill="{p1}" opacity="0.82"/>
  <ellipse cx="0" cy="-228" rx="142" ry="8" fill="{PALETTE['cream']}" opacity="0.5"/>
</g>''')
    elif motif == "bottle":
        body_parts.append(f'''<g transform="translate({w//2-40} {180})" opacity="0.88">
  <rect x="0" y="80" width="80" height="540" rx="4" fill="{p2}" stroke="{PALETTE['cream2']}" stroke-width="1"/>
  <rect x="20" y="0" width="40" height="100" fill="{p2}" stroke="{PALETTE['cream2']}" stroke-width="1"/>
  <rect x="0" y="280" width="80" height="80" fill="{PALETTE['cream']}" opacity="0.65"/>
  <text x="40" y="328" font-family="serif" font-size="20" text-anchor="middle" fill="{PALETTE['bg']}" font-style="italic">EST. 2015</text>
</g>''')
    elif motif == "neon":
        body_parts.append(f'''<g opacity="0.85">
  <path d="M 80 {h//2} Q {w//2} {h//2-220} {w-80} {h//2}" fill="none" stroke="{p1}" stroke-width="3" stroke-linecap="round"/>
  <path d="M 80 {h//2+40} Q {w//2} {h//2-180} {w-80} {h//2+40}" fill="none" stroke="{p1}" stroke-width="14" stroke-linecap="round" opacity="0.18" filter="url(#blur)"/>
  <text x="{w//2}" y="{h//2+120}" font-family="serif" font-size="62" font-style="italic" text-anchor="middle" fill="{PALETTE['cream']}" opacity="0.85">la noche</text>
</g>''')
    elif motif == "bokeh":
        for _ in range(12):
            body_parts.append(f'<circle cx="{random.randint(40,w-40)}" cy="{random.randint(40,h-40)}" r="{random.randint(20,80)}" fill="{random.choice([p1,p2,PALETTE["gold"]])}" opacity="{random.uniform(0.25,0.55):.2f}"/>')
    elif motif == "smoke":
        for i in range(7):
            body_parts.append(f'<ellipse cx="{w//2+random.randint(-100,100)}" cy="{h-100-i*100}" rx="{180+i*20}" ry="{40+i*10}" fill="{PALETTE["cream2"]}" opacity="{0.1-i*0.012:.3f}"/>')
        body_parts.append(f'<circle cx="{w//2}" cy="{h-50}" r="6" fill="{PALETTE["amber"]}"/>')
    elif motif == "ice":
        for _ in range(9):
            x = random.randint(60, w-60); y = random.randint(60, h-60); s = random.randint(50, 110)
            body_parts.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="6" fill="{PALETTE["cream2"]}" opacity="{random.uniform(0.18,0.38):.2f}" transform="rotate({random.randint(-30,30)} {x+s//2} {y+s//2})"/>')
    elif motif == "wood":
        for i in range(0, h, 28):
            body_parts.append(f'<rect x="0" y="{i}" width="{w}" height="20" fill="{PALETTE["bg3"]}" opacity="{0.5+random.uniform(-0.2,0.2):.2f}"/>')
        body_parts.append(f'<circle cx="{w//2}" cy="{h//2}" r="180" fill="{p1}" opacity="0.35" filter="url(#blur)"/>')

    body_parts.append(f'''<rect width="{w}" height="{h}" fill="url(#vigT{idx})"/>
<defs><radialGradient id="vigT{idx}" cx="50%" cy="50%" r="78%">
  <stop offset="0" stop-color="#000" stop-opacity="0"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.78"/>
</radialGradient></defs>''')
    return wrap(w, h, "\n".join(body_parts))

def event_bg():
    body = f'''
<rect width="1600" height="900" fill="{PALETTE['bg']}"/>
<g opacity="0.75" filter="url(#blur)">
  <circle cx="380"  cy="280" r="320" fill="{PALETTE['terra']}" opacity="0.55"/>
  <circle cx="1200" cy="640" r="380" fill="{PALETTE['gold2']}" opacity="0.45"/>
</g>
<!-- glassware row -->
<g opacity="0.82" transform="translate(0 520)">
  {''.join(f'<g transform="translate({i*220+120} 0)"><path d="M -50 -90 L 50 -90 L 6 14 L 6 90 L 30 100 L -30 100 L -6 90 L -6 14 Z" fill="none" stroke="{PALETTE["cream2"]}" stroke-width="1.2"/><path d="M -42 -82 L 42 -82 L 5 6 L -5 6 Z" fill="{[PALETTE["gold"], PALETTE["terra2"], PALETTE["amber"], PALETTE["gold2"]][i%4]}" opacity="0.78"/></g>' for i in range(7))}
</g>
<rect width="1600" height="900" fill="url(#evg)"/>
<defs><radialGradient id="evg" cx="50%" cy="50%" r="75%">
  <stop offset="0" stop-color="#000" stop-opacity="0.2"/>
  <stop offset="1" stop-color="#000" stop-opacity="0.85"/>
</radialGradient></defs>'''
    return wrap(1600, 900, body)

# Generate all files
files = {
    "hero-bar.svg":    hero_bar(7),
    "local-1.svg":     local_collage(0, 11),
    "local-2.svg":     local_collage(1, 23),
    "local-3.svg":     local_collage(2, 37),
    "event-bg.svg":    event_bg(),
}
for i in range(16):
    files[f"gallery-{i+1:02d}.svg"] = gallery_tile(i, 100+i*7)

for name, content in files.items():
    (ROOT / name).write_text(content, encoding="utf-8")
    print(f"wrote {name} ({len(content)//1024} KB)")

print(f"\nTotal {len(files)} files in {ROOT}")
