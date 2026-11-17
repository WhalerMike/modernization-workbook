---
title: "Search"
subtitle: "Full-text search of every page, with tabs by type of content and a filter by book"
description: "New Look preview: full-text search of the workbook (Pagefind), with scope tabs for books, guides, training, workbooks, videos and reference, and filters by book and audience."
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
<div class="nl-page nl-search" id="nl-search-page">
  <form class="nl-hero-search" role="search" aria-label="Search every page" id="nl-s-form">
    <label for="nl-s-q">Search every page</label>
    <div class="nl-search-row">
      <input id="nl-s-q" name="q" type="search" autocomplete="off" placeholder="For example: emergency access, Lifecycle Workflows">
      <button type="submit" class="btn btn-primary">Search</button>
    </div>
  </form>
  <div class="nl-scope-tabs" role="tablist" aria-label="Type of content" id="nl-s-tabs"></div>
  <div class="nl-toolbar">
    <div class="nl-field">
      <label for="nl-s-book">Book</label>
      <select id="nl-s-book"><option value="">Any book</option></select>
    </div>
    <div class="nl-field">
      <label for="nl-s-aud">Audience</label>
      <select id="nl-s-aud"><option value="">Anyone</option></select>
    </div>
  </div>
  <p class="nl-count" id="nl-s-count" role="status" aria-live="polite"></p>
  <ol class="nl-s-results" id="nl-s-results"></ol>
  <p class="nl-more" id="nl-s-more-wrap" hidden><button type="button" class="btn btn-outline-secondary" id="nl-s-more">Show more results</button></p>
  <p class="nl-stats">Looking for a learning path or a guide rather than a page? <a href="browse.html">Browse the catalog</a>.</p>
</div>
<script src="new-look-search.js" defer></script>
```
