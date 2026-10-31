---
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
            :root { --i-navy:#0D1B2E; --i-teal:#1E8C8C; --i-teal-lt:#27BEBE; --i-amber:#B27210; --i-red:#B42318;
                     --i-ink:#243248; --i-muted:#5a6878; --i-line:#dfe5ec; --i-paper2:#f5f7fa; }
            body #title-block-header { display: none !important; }
            body main.content, body div#quarto-document-content, body div.page-columns {
              padding-left: 0 !important; padding-right: 0 !important; max-width: none !important; }
            .insp { font-family: 'DM Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color: var(--i-ink);
                     line-height: 1.65; -webkit-font-smoothing: antialiased; }
            .insp a { color: var(--i-teal); }
            .insp a:hover { color: var(--i-teal-lt); }
            .insp a:focus-visible { outline: 2px solid var(--i-teal); outline-offset: 3px; border-radius: 3px; }
            .insp .hero { padding: 4.5rem 3rem 3.5rem;
              background: radial-gradient(900px 400px at 85% 0%, rgba(30,140,140,0.13), transparent 70%),
                          radial-gradient(700px 300px at 0% 40%, rgba(232,160,32,0.11), transparent 70%), #fff;
              border-bottom: 1px solid var(--i-line); }
            .insp .wrap { max-width: 1100px; margin: 0 auto; }
            .insp .eyebrow, .insp .label { font-family: 'IBM Plex Mono', monospace; font-size: .76rem; letter-spacing: .2em;
              text-transform: uppercase; color: var(--i-amber); font-weight: 500; margin: 0 0 1rem; }
            .insp h1 { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: clamp(2.4rem, 5.5vw, 4.4rem);
              line-height: 1.05; letter-spacing: -.01em; color: var(--i-navy); margin: 0 0 1.25rem; max-width: 16ch; border: 0; }
            .insp h1 em { color: var(--i-teal); }
            .insp .byline { font-size: 1.15rem; color: var(--i-navy); font-weight: 600; margin: 0; }
            .insp .role { color: var(--i-muted); margin: .2rem 0 0; }
            .insp .lede { font-size: 1.15rem; color: var(--i-muted); max-width: 60ch; margin: 1.75rem 0 0; }
            .insp .actions { display: flex; gap: 1rem; flex-wrap: wrap; margin-top: 2rem; }
            .insp .btn-primary, .insp .btn-ghost { font-family: 'IBM Plex Mono', monospace; font-size: .8rem; letter-spacing: .08em;
              padding: .8rem 1.6rem; text-decoration: none; text-transform: uppercase; font-weight: 500; border-radius: 4px; display: inline-block; }
            .insp .btn-primary { background: var(--i-teal); color: #fff !important; border: 1px solid var(--i-teal); }
            .insp .btn-primary:hover { background: var(--i-teal-lt); border-color: var(--i-teal-lt); }
            .insp .btn-ghost { border: 1px solid #6B7A8D; color: var(--i-navy) !important; background: #fff; }
            .insp .btn-ghost:hover { border-color: var(--i-teal); color: var(--i-teal) !important; }
            .insp .why { display: grid; grid-template-columns: 1fr 1fr; gap: 2.5rem; margin-top: 3rem; padding-top: 1.75rem;
              border-top: 1px solid var(--i-line); }
            .insp .why h2 { font-family: 'IBM Plex Mono', monospace; font-size: .74rem; letter-spacing: .18em; text-transform: uppercase;
              color: var(--i-teal); font-weight: 500; margin: 0 0 .5rem; border: 0; }
            .insp .why p { margin: 0; color: var(--i-ink); }
            .insp .section { padding: 3.5rem 3rem; }
            .insp .section.band { background: var(--i-paper2); border-top: 1px solid var(--i-line); border-bottom: 1px solid var(--i-line); }
            .insp .section-title { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; color: var(--i-navy);
              font-size: clamp(1.8rem, 3.2vw, 2.5rem); line-height: 1.18; margin: 0 0 1rem; border: 0; }
            .insp .purpose p { font-size: 1.12rem; max-width: 68ch; }
            .insp .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.25rem; margin-top: 2rem; }
            .insp .p { background: #fff; border: 1px solid var(--i-line); border-top: 3px solid var(--i-teal); border-radius: 6px;
              padding: 1.5rem 1.5rem 1.1rem; scroll-margin-top: 90px; transition: box-shadow .15s, transform .15s; }
            .insp .p:hover { box-shadow: 0 14px 30px -18px rgba(13,27,46,0.18); transform: translateY(-1px); }
            .insp .p.amber { border-top-color: #E8A020; } .insp .p.navy { border-top-color: var(--i-navy); }
            .insp .p.red { border-top-color: var(--i-red); }
            .insp .p.wide { grid-column: 1 / -1; }
            .insp .num { font-family: 'IBM Plex Mono', monospace; font-size: .74rem; letter-spacing: .18em; color: var(--i-teal); font-weight: 500; }
            .insp .p h3 { font-family: 'DM Serif Display', Georgia, serif; font-weight: 400; font-size: 1.45rem; color: var(--i-navy);
              margin: .3rem 0 .6rem; line-height: 1.2; border: 0; }
            .insp .p h3 a.anchor { color: inherit; text-decoration: none; }
            .insp .p h3 a.anchor:hover { color: var(--i-teal); }
            .insp .p p, .insp .p li { font-size: .98rem; }
            .insp .p ul { padding-left: 1.2rem; margin: .3rem 0 .7rem; }
            .insp .p strong { color: var(--i-navy); }
            .insp .sign { margin-top: 2rem; font-size: 1rem; }
            .insp .sign b { color: var(--i-navy); }
            .insp .edition { max-width: 80ch; color: var(--i-muted); font-size: .95rem; }
            .insp .edition p { margin: 0 0 .8rem; }
            @media (max-width: 860px) {
              .insp .grid, .insp .why { grid-template-columns: 1fr; gap: 1rem; }
              .insp .hero, .insp .section { padding-left: 1rem; padding-right: 1rem; } }
            @media (prefers-reduced-motion: reduce) { .insp .p { transition: none; } .insp .p:hover { transform: none; } }
          </style>
---

::: {.insp}

```{=html}
<header class="hero"><div class="wrap">
  <p class="eyebrow">The inspiration behind the Federal Modernization Workbook</p>
  <h1>Expectations for <em>Public Tech</em> Leadership</h1>
  <p class="byline">Gregory J. Barbaccia</p>
  <p class="role">United States Federal Chief Information Officer, 2025</p>
  <p class="lede">Sixteen operating principles the Federal CIO sent to federal technology leaders in May 2025: <em>"a commitment to integrity, service, and transformational delivery."</em> They are the standard the Federal Modernization Workbook tries to meet, chapter by chapter.</p>
  <div class="actions">
    <a class="btn-primary" href="expectations-for-public-tech-leadership.pdf">Download the PDF</a>
    <a class="btn-ghost" href="#the-principles">Read the principles</a>
    <a class="btn-ghost" href="https://web.archive.org/web/20260118195929/https://federalnewsnetwork.com/cio-news/2025/05/federal-cio-outlines-16-operating-principles-for-it-leaders/">Published source</a>
  </div>
  <div class="why">
    <div><h2>Why it matters here</h2><p>The workbook exists to show its work. Every claim is checked against a primary source and footnoted, every correction is logged in the open, and every book names the problem plainly before proposing the fix: <a href="#principle-4">Show Your Work</a>, <a href="#principle-5">Truth Over Comfort</a> and <a href="#principle-9">Label the Problem</a>, applied to modernization. Start with <a href="../books/index.html">the books</a>.</p></div>
    <div><h2>Edition</h2><p>The full text as written, set in the workbook's style by Michael F. Stratton. Published by Federal News Network, May 8, 2025 (<a href="https://web.archive.org/web/20260118195929/https://federalnewsnetwork.com/cio-news/2025/05/federal-cio-outlines-16-operating-principles-for-it-leaders/">archived copy</a>). Not an official U.S. government publication.</p></div>
  </div>
</div></header>

<section class="section"><div class="wrap purpose">
  <p class="label">Purpose</p>
  <h2 class="section-title">Choosing to serve means choosing to build.</h2>
  <p>Choosing to serve in this office means choosing to build. It means choosing accountability over comfort, clarity over confusion, and outcomes over process. This document outlines the expectations we hold for ourselves—and each other—as we modernize the digital infrastructure of the United States.</p>
  <p>This is not a typical government shop. We are here to fix what's broken and build what's missing. The standards below are how we ensure that mission is fulfilled.</p>
</div></section>

<section class="section band" id="the-principles"><div class="wrap">
  <p class="label">The sixteen principles</p>
  <h2 class="section-title">How we lead, serve and build.</h2>
  <div class="grid">
<article class="p teal" id="principle-1">
  <div class="num">01</div>
  <h3><a class="anchor" href="#principle-1">Trust Is the Foundation</a></h3>
  <p>Every success we'll have is downstream of trust. Trust among teammates, between agencies, with the public, and with our partners. Trust is extended to you on day one—and it is yours to lose.</p>
<p>You will be exposed to sensitive information: interagency cybersecurity gaps, budget vulnerabilities, contract disputes, employee performance data, and more. With transparency comes responsibility.</p>
<ul><li>Don't lie. Don't omit to mislead.</li><li>Know when to speak and when to withhold. If in doubt, do not tout.</li><li>Confused? Ask a Lead. No one gets in trouble for asking.</li></ul>
<p>Breach of trust is the one failure from which there is no guaranteed recovery. Everything else is coachable.</p>
</article>
<article class="p amber" id="principle-2">
  <div class="num">02</div>
  <h3><a class="anchor" href="#principle-2">Exercise Judgment Relentlessly</a></h3>
  <p>Judgment is not instinct—it's a learned skill. Learn it. Practice it.</p>
<p>Good judgment requires understanding both <em>intent</em> (why are we doing this?) and <em>context</em> (what are the circumstances?). If either is unclear, you are expected to ask until it is not.</p>
<p>Before you act:</p>
<ul><li>Understand the mission.</li><li>Understand the system.</li><li>Understand the impact.</li></ul>
<p>No matter your title, you are empowered to improve how we think, decide, and execute—by bringing good judgment to the table.</p>
</article>
<article class="p navy" id="principle-3">
  <div class="num">03</div>
  <h3><a class="anchor" href="#principle-3">Own the Outcome</a></h3>
  <p>Imagine every system failure is your fault. Act accordingly.</p>
<ul><li>Don't limit yourself to your job description.</li><li>If you see a problem, you own the solution.</li><li>Default to action, not passivity.</li></ul>
<p>Push beyond your comfort zone. <strong>This is how we shift the culture of federal IT from slow and reactive to bold and effective.</strong> This office only works if everyone behaves like a founder.</p>
</article>
<article class="p red" id="principle-4">
  <div class="num">04</div>
  <h3><a class="anchor" href="#principle-4">Show Your Work</a></h3>
  <p>Transparency is the fuel of accountability and shared learning. We are not interested in black-box decisions or vague plans.</p>
<ul><li>Document your logic.</li><li>Share your assumptions.</li><li>Make it easy for others to follow.</li><li>Ask the same of your colleagues.</li></ul>
<p>This creates a "hive mind" where decisions improve through scrutiny and learning compounds across the team.</p>
</article>
<article class="p teal" id="principle-5">
  <div class="num">05</div>
  <h3><a class="anchor" href="#principle-5">Truth Over Comfort</a></h3>
  <p>We are truth-seeking above all. The truth is often inconvenient, uncomfortable, or career-challenging—but we pursue it anyway.</p>
<ul><li>Call out broken processes.</li><li>Identify policy contradictions.</li><li>Challenge assumptions, even from the top.</li></ul>
<p>We don't sugarcoat: the stakes are too high. <strong>This is a mission-driven team, not a compliance-driven bureaucracy.</strong></p>
</article>
<article class="p amber" id="principle-6">
  <div class="num">06</div>
  <h3><a class="anchor" href="#principle-6">Default to Positive Intent</a></h3>
  <p>Start every interaction assuming your colleagues are here for the right reasons. This reduces friction, improves collaboration, and supports high-bandwidth communication.</p>
<ul><li>If something feels off, assume miscommunication before malice—and talk it out.</li><li>Extend the benefit of the doubt. Expect it in return.</li></ul>
</article>
<article class="p navy" id="principle-7">
  <div class="num">07</div>
  <h3><a class="anchor" href="#principle-7">Burnout Is a National Security Risk</a></h3>
  <p>You can't deliver if you're depleted. And you're not serving the mission by pretending everything is fine.</p>
<ul><li>Know the signs: cynicism, disengagement, irritability, fatigue.</li><li>Speak up early. Leads are here to help you deal if it's too much.</li><li>Leads are responsible for managing workloads and expectations.</li></ul>
<p>Preventing burnout requires intentional investment in well-being. We're in this for the long haul—act accordingly.</p>
</article>
<article class="p red" id="principle-8">
  <div class="num">08</div>
  <h3><a class="anchor" href="#principle-8">Feedback Is a Civic Duty</a></h3>
  <p>High-performing teams give and receive feedback constantly—and constructively.</p>
<ul><li>Feedback should be frequent, actionable, and kind.</li><li>Don't wait for a performance review.</li><li>Don't talk behind backs. Say it directly, or escalate it responsibly.</li></ul>
<p>We're not here to coast. We're here to grow.</p>
</article>
<article class="p teal" id="principle-9">
  <div class="num">09</div>
  <h3><a class="anchor" href="#principle-9">Label the Problem</a></h3>
  <p>Call a problem what it is—don't avoid it to protect egos, maintain surface harmony, or wait for someone else to say it.</p>
<ul><li>Call out technical debt.</li><li>Flag a failed procurement strategy.</li><li>Surface ambiguous goals.</li><li>Name the "elephants in the room."</li></ul>
<p>Nothing gets better until someone identifies what's broken. Be that someone.</p>
</article>
<article class="p amber" id="principle-10">
  <div class="num">10</div>
  <h3><a class="anchor" href="#principle-10">Commitments Are Sacred</a></h3>
  <p>This office runs on trust and delivery. If you say you'll do something, it gets done—on time, to spec, or renegotiated early.</p>
<ul><li>Don't ghost.</li><li>Don't leave others guessing.</li><li>If priorities shift, communicate fast.</li></ul>
<p>Everyone has too much to do. That's why clarity and follow-through matter.</p>
</article>
<article class="p navy" id="principle-11">
  <div class="num">11</div>
  <h3><a class="anchor" href="#principle-11">Lead When It's Time, Follow When It's Not</a></h3>
  <p>Leadership isn't about hierarchy—it's about ownership. When it's your turn to lead, take full responsibility for vision, planning, communication, and outcomes.</p>
<p>When you're not leading:</p>
<ul><li>Contribute fully.</li><li>Voice dissent during planning.</li><li>Execute the final plan with conviction.</li></ul>
<p>Mission-first doesn't mean consensus-first. It means clarity, commitment, and speed.</p>
</article>
<article class="p red" id="principle-12">
  <div class="num">12</div>
  <h3><a class="anchor" href="#principle-12">Proactivity Over Permission-Seeking</a></h3>
  <p>We're here to build new systems—not wait for new instructions.</p>
<ul><li>If you need information, go find it.</li><li>If something's unclear, ask fast.</li><li>If bad news is coming, surface it early.</li></ul>
<p>Don't assume someone else is handling it. Don't hope the issue will resolve on its own.</p>
<p>You are the system now.</p>
</article>
<article class="p wide teal" id="principle-13">
  <div class="num">13</div>
  <h3><a class="anchor" href="#principle-13">Cross-Functional Thinking Is Mandatory</a></h3>
  <p>Government doesn't need more people who only care about their own swim lane. We need generalists who can spot patterns, challenge assumptions, and think holistically.</p>
<ul><li>Learn the language of other functions.</li><li>Ask how policy affects engineering.</li><li>Understand how tech affects procurement.</li><li>Think like a product manager, a security officer, and a strategist.</li></ul>
<p>Our edge is interdisciplinary thinking applied at speed.</p>
</article>
<article class="p wide amber" id="principle-14">
  <div class="num">14</div>
  <h3><a class="anchor" href="#principle-14">Forward Deploy to Earn Trust and Surface Truth</a></h3>
  <p>The mission doesn't live in conference rooms at headquarters. It lives in the systems, networks, and workflows of the 100+ sub-agencies that make up the federal government. If we're not embedded in their world, we can't claim to understand their challenges—let alone solve them.</p>
<p>That's why we <strong>forward deploy</strong>.</p>
<p>Whether it's a field office, a regional data center, or a program team buried under legacy systems and outdated contracts, our job is to meet them where they are.</p>
<ul><li><strong>Proximity creates perspective.</strong> The best policy and architecture decisions are informed by on-the-ground reality.</li>
<li><strong>Trust is earned face-to-face.</strong> When agency teams see that we show up, listen, and help—without judgment—they start picking up the phone.</li>
<li><strong>Influence requires empathy.</strong> Transformation doesn't happen from the top down. It spreads when we understand lived pain points and tailor solutions that work in real-world environments.</li></ul>
<p>You don't need to be asked to visit a sub-agency. You should volunteer. Show up early. Stay late. Ask the hard questions—and the basic ones.</p>
<p>This is not a remote-control mission. It's a hands-on, forward-leaning effort to unlock the latent potential of government systems by working alongside those who maintain and endure them every day.</p>
<p>If we want to modernize the system, we have to walk through it.</p>
</article>
<article class="p navy" id="principle-15">
  <div class="num">15</div>
  <h3><a class="anchor" href="#principle-15">This Office Only Works If You're All In</a></h3>
  <p>We are building a new operating model for government. One that delivers faster, secures smarter, and serves better.</p>
<p>That won't happen with part-time passion or half-hearted effort. This job isn't easy. It's not always fun. But it matters—immensely.</p>
<p>We are here to serve the public and leave behind a better government than we found.</p>
<p>That's the standard.</p>
</article>
<article class="p red" id="principle-16">
  <div class="num">16</div>
  <h3><a class="anchor" href="#principle-16">Your Best Is Our Best</a></h3>
  <p>Your commitment, passion, and drive will deliver success. I am most thankful for all you do!</p>
</article>
  </div>
  <div class="sign"><b>Gregory Barbaccia</b><br>US Federal Chief Information Officer<br>Executive Office of the President</div>
</div></section>

<section class="section"><div class="wrap edition">
  <p class="label">About this edition</p>
  <p>Text: Gregory J. Barbaccia, <em>Expectations for Public Tech Leadership</em>, sent by email to federal technology leaders in May 2025 and reproduced in full by Federal News Network, "Federal CIO outlines 16 operating principles for IT leaders," Jason Miller, May 8, 2025 (<a href="https://web.archive.org/web/20260118195929/https://federalnewsnetwork.com/cio-news/2025/05/federal-cio-outlines-16-operating-principles-for-it-leaders/">archived copy</a>). The principles appear in their original order. The email's cover note to staff and the Office of the Federal CIO logo are not reproduced.</p>
  <p>Listen: FedScoop's <em>The Daily Scoop Podcast</em>, "<a href="https://fedscoop.com/radio/exclusive-interview-with-federal-cio-greg-barbaccia/">A special interview with Federal CIO Greg Barbaccia</a>," December 9, 2025, interviewed by Madison Alder (about 23 minutes; FedScoop publishes no transcript). Looking back on his first year, Mr. Barbaccia says the job turned out to be treating the disease rather than the symptoms: changing the operating environment that lets inefficiency persist, not fixing broken systems one agency at a time. He argues that commodity technology agnostic to an agency's mission should be bought and run once for the whole government; that no CIO faces a problem another agency has not already solved, so agencies need a marketplace for those ideas; and that authority to operate has become a box-checking exercise disconnected from real security, which he wants to rebuild from first principles. The initiatives the interview names:</p>
  <ul>
    <li><a href="https://www.fedramp.gov/20x/">FedRAMP 20x</a>, which he calls a complete rethinking rather than another revision of <a href="https://www.fedramp.gov/rev5/">FedRAMP Rev. 5</a>; a second rethinking is his first 2026 priority.</li>
    <li>GSA's <a href="https://www.gsa.gov/about-us/newsroom/news-releases/gsa-unveils-onegov-strategy-04292025">OneGov strategy</a>: centralized pricing and terms, including the low-cost AI agreements.</li>
    <li>Consolidation of IT contracts under GSA, <a href="https://www.whitehouse.gov/presidential-actions/2025/03/eliminating-waste-and-saving-taxpayer-dollars-by-consolidating-procurement/">Executive Order 14240</a>, and IT consolidation within agencies.</li>
    <li><a href="https://www.whitehouse.gov/presidential-actions/2025/01/establishing-and-implementing-the-presidents-department-of-government-efficiency/">DOGE and the U.S. DOGE Service</a> (formerly the U.S. Digital Service), whose agency teams now report to agency heads.</li>
    <li>Agency <a href="https://github.com/ombegov/2024-Federal-AI-Use-Case-Inventory">AI use case inventories</a> (more than 2,000 use cases reported the prior year) and <a href="https://www.ai.gov/action-plan">America's AI Action Plan</a>.</li>
    <li>The State Department's StateChat, since written up in the department's <a href="https://nextgov.com/artificial-intelligence/2026/07/state-department-releases-playbook-generative-ai/415006">generative AI playbook</a>.</li>
    <li>The <a href="https://cio.gov/">Federal CIO Council</a> and the 24 <a href="https://www.law.cornell.edu/uscode/text/31/901">CFO Act agencies</a>.</li>
    <li>Authority-to-operate reform, today grounded in the <a href="https://csrc.nist.gov/pubs/sp/800/37/r2/final">NIST Risk Management Framework (SP 800-37)</a>.</li>
    <li>An unreleased OPM tech-talent initiative; OPM launched the <a href="https://techforce.gov/">U.S. Tech Force</a> six days later. He also floats a "semester in government" for college credit.</li>
  </ul>
  <p>Mr. Barbaccia served as Federal CIO from January 2025 to August 2026. This page and its <a href="expectations-for-public-tech-leadership.pdf">PDF edition</a> are not official U.S. government publications, and neither the Office of Management and Budget nor Mr. Barbaccia has reviewed or endorsed the <a href="../../index.html">Federal Modernization Workbook</a>.</p>
</div></section>
```

:::
