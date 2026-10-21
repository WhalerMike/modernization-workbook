"""Build docs/inspiration/index.md (the styled web page) from _pdf/source.html (the PDF source), so the page and the PDF
carry the same text. Run from the repo root:  python docs/inspiration/_pdf/build_page.py"""
import re
from pathlib import Path

HERE = Path(__file__).parent
src = (HERE / "source.html").read_text(encoding="utf-8")

purpose = re.search(r'<div class="purpose">(.*?)</div>', src, re.S).group(1).strip()
cards = re.findall(r'<div class="p( wide)?"><div class="num">(\d+)</div><h3>(.*?)</h3>(.*?)</div>\s*(?=<div class="p|</div>\s*<div class="sign">)', src, re.S)
assert len(cards) == 16, len(cards)

TONES = ["teal", "amber", "navy", "red"]
card_html = []
for k, (wide, num, title, body) in enumerate(cards):
    n = int(num)
    cls = "p" + (" wide" if n in (13, 14) else "") + f" {TONES[k % 4]}"
    card_html.append(
        f'<article class="{cls}" id="principle-{n}">\n'
        f'  <div class="num">{num}</div>\n'
        f'  <h3><a class="anchor" href="#principle-{n}">{title}</a></h3>\n'
        f'  {body.strip()}\n'
        f'</article>')

FNN = "https://web.archive.org/web/20260118195929/https://federalnewsnetwork.com/cio-news/2025/05/federal-cio-outlines-16-operating-principles-for-it-leaders/"
page = f'''---
title: "Inspiration"
pagetitle: "Inspiration — Expectations for Public Tech Leadership"
description: "The sixteen operating principles the U.S. Federal CIO sent federal technology leaders in May 2025, the inspiration behind the Federal Modernization Workbook."
doc-type: section-landing
audience: [Executive, Technical, Customer]
family: inspiration
lifecycle: active
tiers_adopted: []
lifecycle_review: 2027-04-01
page-layout: full
toc: false
format:
  html:
    anchor-sections: false
    include-in-header:
      - text: |
          <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
          <style>
            :root {{ --i-navy:#0D1B2E; --i-teal:#1E8C8C; --i-teal-lt:#27BEBE; --i-amber:#B27210; --i-red:#B42318;
                     --i-ink:#243248; --i-muted:#5a6878; --i-line:#dfe5ec; --i-paper2:#f5f7fa; }}
            body #title-block-header {{ display: none !important; }}
            body main.content, body div#quarto-document-content, body div.page-columns {{
              padding-left: 0 !important; padding-right: 0 !important; max-width: none !important; }}
            .insp {{ font-family: 'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: var(--i-ink);
                     line-height: 1.65; -webkit-font-smoothing: antialiased; }}
            .insp a {{ color: var(--i-teal); }}
            .insp a:hover {{ color: var(--i-teal-lt); }}
            .insp a:focus-visible {{ outline: 2px solid var(--i-teal); outline-offset: 3px; border-radius: 3px; }}
            .insp .hero {{ padding: 4.5rem 3rem 3.5rem;
              background: radial-gradient(900px 400px at 85% 0%, rgba(30,140,140,0.13), transparent 70%),
                          radial-gradient(700px 300px at 0% 40%, rgba(232,160,32,0.11), transparent 70%), #fff;
              border-bottom: 1px solid var(--i-line); }}
            .insp .wrap {{ max-width: 1100px; margin: 0 auto; }}
            .insp .eyebrow, .insp .label {{ font-family: 'IBM Plex Mono', monospace; font-size: .76rem; letter-spacing: .2em;
              text-transform: uppercase; color: var(--i-amber); font-weight: 500; margin: 0 0 1rem; }}
            .insp h1 {{ font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: clamp(2.4rem, 5.5vw, 4.4rem);
              line-height: 1.05; letter-spacing: -.01em; color: var(--i-navy); margin: 0 0 1.25rem; max-width: 16ch; border: 0; }}
            .insp h1 em {{ color: var(--i-teal); }}
            .insp .byline {{ font-size: 1.15rem; color: var(--i-navy); font-weight: 600; margin: 0; }}
            .insp .role {{ color: var(--i-muted); margin: .2rem 0 0; }}
            .insp .lede {{ font-size: 1.15rem; color: var(--i-muted); max-width: 60ch; margin: 1.75rem 0 0; }}
            .insp .actions {{ display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 2rem; }}
            .insp .btn-primary, .insp .btn-ghost {{ font-family: 'IBM Plex Mono', monospace; font-size: .8rem; letter-spacing: .08em;
              padding: .8rem 1.6rem; text-decoration: none; text-transform: uppercase; font-weight: 500; border-radius: 4px; display: inline-block; }}
            .insp .btn-primary {{ background: var(--i-teal); color: #fff !important; border: 1px solid var(--i-teal); }}
            .insp .btn-primary:hover {{ background: var(--i-teal-lt); border-color: var(--i-teal-lt); }}
            .insp .btn-ghost {{ border: 1px solid #6B7A8D; color: var(--i-navy) !important; background: #fff; }}
            .insp .btn-ghost:hover {{ border-color: var(--i-teal); color: var(--i-teal) !important; }}
            .insp .why {{ display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-top: 3rem; padding-top: 1.75rem;
              border-top: 1px solid var(--i-line); }}
            .insp .why h2 {{ font-family: 'IBM Plex Mono', monospace; font-size: .74rem; letter-spacing: .18em; text-transform: uppercase;
              color: var(--i-teal); font-weight: 500; margin: 0 0 .5rem; border: 0; }}
            .insp .why p {{ margin: 0; color: var(--i-ink); }}
            .insp .section {{ padding: 3.5rem 3rem; }}
            .insp .section.band {{ background: var(--i-paper2); border-top: 1px solid var(--i-line); border-bottom: 1px solid var(--i-line); }}
            .insp .section-title {{ font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; color: var(--i-navy);
              font-size: clamp(1.8rem, 3.2vw, 2.5rem); line-height: 1.18; margin: 0 0 1rem; border: 0; }}
            .insp .purpose p {{ font-size: 1.12rem; max-width: 68ch; }}
            .insp .grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; margin-top: 2rem; }}
            .insp .p {{ background: #fff; border: 1px solid var(--i-line); border-top: 3px solid var(--i-teal); border-radius: 6px;
              padding: 1.5rem 1.5rem 1.1rem; scroll-margin-top: 90px; transition: box-shadow .15s, transform .15s; }}
            .insp .p:hover {{ box-shadow: 0 14px 30px -18px rgba(13,27,46,0.18); transform: translateY(-1px); }}
            .insp .p.amber {{ border-top-color: #E8A020; }} .insp .p.navy {{ border-top-color: var(--i-navy); }}
            .insp .p.red {{ border-top-color: var(--i-red); }}
            .insp .p.wide {{ grid-column: 1 / -1; }}
            .insp .num {{ font-family: 'IBM Plex Mono', monospace; font-size: .74rem; letter-spacing: .18em; color: var(--i-teal); font-weight: 500; }}
            .insp .p h3 {{ font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 1.45rem; color: var(--i-navy);
              margin: .3rem 0 .6rem; line-height: 1.2; border: 0; }}
            .insp .p h3 a.anchor {{ color: inherit; text-decoration: none; }}
            .insp .p h3 a.anchor:hover {{ color: var(--i-teal); }}
            .insp .p p, .insp .p li {{ font-size: .98rem; }}
            .insp .p ul {{ padding-left: 1.2rem; margin: .3rem 0 .7rem; }}
            .insp .p strong {{ color: var(--i-navy); }}
            .insp .sign {{ margin-top: 2rem; font-size: 1rem; }}
            .insp .sign b {{ color: var(--i-navy); }}
            .insp .edition {{ max-width: 80ch; color: var(--i-muted); font-size: .95rem; }}
            .insp .edition p {{ margin: 0 0 .8rem; }}
            @media (max-width: 860px) {{
              .insp .grid, .insp .why {{ grid-template-columns: 1fr; gap: 1rem; }}
              .insp .hero, .insp .section {{ padding-left: 1rem; padding-right: 1rem; }} }}
            @media (prefers-reduced-motion: reduce) {{ .insp .p {{ transition: none; }} .insp .p:hover {{ transform: none; }} }}
          </style>
---

::: {{.insp}}

```{{=html}}
<header class="hero"><div class="wrap">
  <p class="eyebrow">The inspiration behind the Federal Modernization Workbook</p>
  <h1>Expectations for <em>Public Tech</em> Leadership</h1>
  <p class="byline">Gregory J. Barbaccia</p>
  <p class="role">United States Federal Chief Information Officer, 2025</p>
  <p class="lede">Sixteen operating principles the Federal CIO sent to federal technology leaders in May 2025: <em>"a commitment to integrity, service, and transformational delivery."</em> They are the standard the Federal Modernization Workbook tries to meet, chapter by chapter.</p>
  <div class="actions">
    <a class="btn-primary" href="expectations-for-public-tech-leadership.pdf">Download the PDF</a>
    <a class="btn-ghost" href="#the-principles">Read the principles</a>
    <a class="btn-ghost" href="{FNN}">Published source</a>
  </div>
  <div class="why">
    <div><h2>Why it matters here</h2><p>The workbook exists to show its work. Every claim is checked against a primary source and footnoted, every correction is logged in the open, and every book names the problem plainly before proposing the fix: <a href="#principle-4">Show Your Work</a>, <a href="#principle-5">Truth Over Comfort</a> and <a href="#principle-9">Label the Problem</a>, applied to modernization. Start with <a href="../books/index.html">the books</a>.</p></div>
    <div><h2>Edition</h2><p>The full text as written, set in the workbook's style by Michael F. Stratton. Published by Federal News Network, May 8, 2025 (<a href="{FNN}">archived copy</a>). Not an official U.S. government publication.</p></div>
  </div>
</div></header>

<section class="section"><div class="wrap purpose">
  <p class="label">Purpose</p>
  <h2 class="section-title">Choosing to serve means choosing to build.</h2>
  {purpose}
</div></section>

<section class="section band" id="the-principles"><div class="wrap">
  <p class="label">The sixteen principles</p>
  <h2 class="section-title">How we lead, serve and build.</h2>
  <div class="grid">
{chr(10).join(card_html)}
  </div>
  <div class="sign"><b>Gregory Barbaccia</b><br>US Federal Chief Information Officer<br>Executive Office of the President</div>
</div></section>

<section class="section"><div class="wrap edition">
  <p class="label">About this edition</p>
  <p>Text: Gregory J. Barbaccia, <em>Expectations for Public Tech Leadership</em>, sent by email to federal technology leaders in May 2025 and reproduced in full by Federal News Network, "Federal CIO outlines 16 operating principles for IT leaders," Jason Miller, May 8, 2025 (<a href="{FNN}">archived copy</a>). The principles appear in their original order. The email's cover note to staff and the Office of the Federal CIO logo are not reproduced.</p>
  <p>Mr. Barbaccia served as Federal CIO from January 2025 to August 2026. This page and its <a href="expectations-for-public-tech-leadership.pdf">PDF edition</a> are not official U.S. government publications, and neither the Office of Management and Budget nor Mr. Barbaccia has reviewed or endorsed the <a href="../../index.html">Federal Modernization Workbook</a>.</p>
</div></section>
```

:::
'''
(HERE.parent / "index.md").write_text(page, encoding="utf-8", newline="\n")
print("wrote", HERE.parent / "index.md", len(card_html), "principles")
