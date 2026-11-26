---
title: "Find a path"
subtitle: "Start from a topic or your role, pick a learning path, or browse everything the workbook offers by type and level"
description: "New Look preview: a home page that leads with topics. Start from a topic hub or your role, choose a featured learning path, or open the Browse catalog of every learning path, implementation guide, developer workbook, book, lab set and video series."
doc-type: section-landing
research-status: draft
review-status: pending
page-layout: full
toc: false
css: new-look.css
body-classes: fmw-new-look
hide-description: true
---

```{=html}
<div class="nl-page nl-home">
  <form class="nl-hero-search" action="browse.html" method="get" role="search" aria-label="Search the catalog">
    <label for="nl-home-q">Search learning paths, guides, workbooks, books and labs</label>
    <div class="nl-search-row">
      <input id="nl-home-q" name="q" type="search" autocomplete="off" placeholder="For example: privileged access, Intune, evidence">
      <button type="submit" class="btn btn-primary">Search</button>
    </div>
  </form>
  <p class="nl-stats" id="nl-stats"></p>
</div>
```

## Topics {#topic-hubs}

Everything the workbook has on one subject, on one page: the book chapters, the plan, the guide, the developer workbook, the learning path, the labs, the videos and the code.

{{< include _topics.md >}}

## Start with your role {#roles}

```{=html}
<div class="nl-page"><ul class="nl-tiles" id="nl-roles" aria-label="Roles"></ul></div>
```

## Featured learning paths {#featured}

Each learning path is a short series of modules, in order, each with a lab you run on a laptop and one you can repeat in a test tenant.

```{=html}
<div class="nl-page">
  <ul class="nl-grid" id="nl-featured" aria-label="Featured learning paths"></ul>
  <p class="nl-more"><a href="browse.html?type=Learning+path">Every learning path</a></p>
</div>
```

## Browse by type {#types}

```{=html}
<div class="nl-page"><ul class="nl-tiles nl-tiles-small" id="nl-types" aria-label="Types"></ul></div>
```

## Browse the catalog by topic {#topics}

```{=html}
<div class="nl-page">
  <ul class="nl-chips" id="nl-topics" aria-label="Topics"></ul>
  <noscript><p>The tiles on this page need JavaScript. Every item is also listed on the existing <a href="../training/index.html">Training</a>, <a href="../books/index.html">Books</a> and <a href="../../workbook-map.html">Workbook Map</a> pages.</p></noscript>
</div>
<script src="new-look.js" defer></script>
```

## Reading plans {#plans}

A few weeks of reading and labs for each role, in order: [Reading plans](plans/index.md). Or search the full text of every page, with tabs by type of content: [Search](search.md).

## What differs from the current site {#what-differs}

The New Look renders the same pages as the [current site](https://whalermike.github.io/modernization-workbook/), which is unchanged. No page's text is edited; everything below comes from the pages' own front matter, folders and links, and from data files kept for the New Look.

- **Topics first, then paths.** This home page, led by the [topic hubs](../topics/index.md), the [Browse](browse.md) catalog with filters by type, role, topic, level and status, and [reading plans](plans/index.md) by role.
- **A navbar by type of content:** Browse, Plans, Learning paths, Books, Guides, Workbooks, Watch, Reference and Search, built from the folders, so a new path, guide or workbook appears by itself.
- **A content-type label above every title** (Book, Chapter, Implementation guide, Learning path, Module, Workbook chapter and others) and an **Applies to** line under it.
- **"At a glance"** on each learning path, and **"Module N of M"** or **"Chapter N of M"** on modules and chapters.
- **Overview, Build, Train, Labs, Watch and Reference cards** at the top of each book and guide, and **Microsoft Learn training cards** (paths, modules, certifications and Applied Skills, each checked against Learn's catalog).
- **A Related block** at the end of chapters, modules and guides: the next page, the matching module or chapter, its lab, its video, its guide step and one or two Learn modules.
- **One GCC anchor:** each page's GCC availability section also answers to `#gcc-availability`, and the [GCC availability](gcc-availability.md) index lists every such section.
- **Search with tabs** by type of content and filters by book and audience.
- **Portal or code tabs** on one guide step, as a demonstration (Defender XDR, Step 2's fleet check).
- **Extras:** each book's Word edition in its sidebar, and a filter box on long sidebars.
