---
title: "Browse the workbook"
subtitle: "Every learning path, implementation guide, developer workbook, book, lab set and video series, with filters"
description: "New Look preview: a catalog of the Federal Modernization Workbook. Filter learning paths, implementation guides, developer workbooks, books, labs and video series by type, role, topic, level and review status, search them, and share a filtered view by its address."
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
<div class="nl-page nl-browse" id="nl-browse">
  <button type="button" class="nl-filter-toggle btn btn-outline-secondary" id="nl-filter-toggle" aria-expanded="false" aria-controls="nl-rail">Filters</button>
  <div class="nl-rail" id="nl-rail" role="region" aria-labelledby="nl-rail-title">
    <div class="nl-rail-head">
      <h2 id="nl-rail-title">Filter</h2>
      <button type="button" class="nl-linkbtn" id="nl-clear">Clear all</button>
    </div>
    <div id="nl-facets"></div>
  </div>
  <div class="nl-results">
    <div class="nl-toolbar" role="search" aria-label="Search the catalog">
      <div class="nl-field nl-field-grow">
        <label for="nl-search">Search</label>
        <input type="search" id="nl-search" autocomplete="off" placeholder="Filter by keyword">
      </div>
      <div class="nl-field">
        <label for="nl-sort">Sort by</label>
        <select id="nl-sort">
          <option value="type">Type, then title</option>
          <option value="relevance">Best match</option>
          <option value="title">Title, A to Z</option>
          <option value="short">Shortest first</option>
          <option value="long">Longest first</option>
          <option value="count">Most modules or chapters</option>
        </select>
      </div>
    </div>
    <div class="nl-summary">
      <p class="nl-count" id="nl-count" role="status" aria-live="polite">Loading the catalog…</p>
      <ul class="nl-active" id="nl-active" aria-label="Active filters"></ul>
    </div>
    <p class="nl-sitewide" id="nl-sitewide" hidden>
      <a id="nl-sitewide-link" href="search.html"></a>
    </p>
    <ul class="nl-grid" id="nl-cards" aria-label="Results"></ul>
  </div>
</div>
<noscript><p>The catalog needs JavaScript. Every item is also listed on the existing <a href="../training/index.html">Training</a>, <a href="../books/index.html">Books</a> and <a href="../../workbook-map.html">Workbook Map</a> pages.</p></noscript>
<script src="new-look.js" defer></script>
```
