// New Look preview: the Search page (docs/new-look/search.md). Pagefind's own
// JavaScript API over the New Look's index, which the deploy builds with the
// filters scripts/newlook/build_context.py puts on every page: scope (the
// tabs), type, book and audience. The address keeps the query and filters
// (?q=…&scope=…&book=…), so a search can be shared. Vanilla JavaScript.
(function () {
  "use strict";
  var SCOPES = ["All", "Books", "Guides", "Training", "Workbooks", "Videos", "Reference"];
  var PAGE = 10;
  var form = document.getElementById("nl-s-form");
  var input = document.getElementById("nl-s-q");
  var tabs = document.getElementById("nl-s-tabs");
  var bookSel = document.getElementById("nl-s-book");
  var audSel = document.getElementById("nl-s-aud");
  var count = document.getElementById("nl-s-count");
  var list = document.getElementById("nl-s-results");
  var moreWrap = document.getElementById("nl-s-more-wrap");
  var more = document.getElementById("nl-s-more");
  if (!form) return;

  var params = new URLSearchParams(window.location.search);
  var state = { q: params.get("q") || "", scope: params.get("scope") || "All", book: params.get("book") || "", audience: params.get("audience") || "" };
  input.value = state.q;

  var offset = (document.querySelector('meta[name="quarto:offset"]') || {}).content || "../../";
  var root = new URL(offset, window.location.href);
  var pagefind = null;
  var results = [];
  var shown = 0;

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }

  function writeUrl() {
    var p = new URLSearchParams();
    if (state.q) p.set("q", state.q);
    if (state.scope !== "All") p.set("scope", state.scope);
    if (state.book) p.set("book", state.book);
    if (state.audience) p.set("audience", state.audience);
    var qs = p.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }

  function drawTabs(counts) {
    tabs.textContent = "";
    SCOPES.forEach(function (s) {
      var n = s === "All" ? Object.keys(counts).reduce(function (a, k) { return a + counts[k]; }, 0) : (counts[s] || 0);
      var b = el("button", { type: "button", role: "tab", "aria-selected": String(state.scope === s), "class": "nl-scope-tab" }, s + (state.q ? " (" + n + ")" : ""));
      b.addEventListener("click", function () { state.scope = s; run(); });
      tabs.appendChild(b);
    });
  }

  function filters(withScope) {
    var f = {};
    if (withScope && state.scope !== "All") f.scope = state.scope;
    if (state.book) f.book = state.book;
    if (state.audience) f.audience = state.audience;
    return f;
  }

  function showMore() {
    var next = results.slice(shown, shown + PAGE);
    shown += next.length;
    Promise.all(next.map(function (r) { return r.data(); })).then(function (rows) {
      rows.forEach(function (d) {
        var li = el("li", { "class": "nl-s-result" });
        var type = d.filters && d.filters.type ? d.filters.type[0] : "";
        if (type) li.appendChild(el("p", { "class": "nl-card-type" }, type));
        var h = el("h3", { "class": "nl-card-title" });
        h.appendChild(el("a", { href: d.url }, (d.meta && d.meta.title) || d.url));
        li.appendChild(h);
        var p = el("p", { "class": "nl-card-desc" });
        p.innerHTML = d.excerpt; // Pagefind's excerpt: the page's own text with <mark> around the match.
        li.appendChild(p);
        list.appendChild(li);
      });
      moreWrap.hidden = shown >= results.length;
    });
  }

  function run() {
    writeUrl();
    if (!pagefind) return;
    list.textContent = "";
    shown = 0;
    if (!state.q) {
      drawTabs({});
      count.textContent = "Type a word or phrase to search every page.";
      moreWrap.hidden = true;
      return;
    }
    Promise.all([
      pagefind.search(state.q, { filters: filters(false) }),
      pagefind.search(state.q, { filters: filters(true) })
    ]).then(function (both) {
      drawTabs((both[0].filters && both[0].filters.scope) || {});
      results = both[1].results;
      count.textContent = results.length + (results.length === 1 ? " page matches" : " pages match") + (state.scope !== "All" ? " in " + state.scope : "");
      showMore();
    });
  }

  function options(sel, values, current) {
    Object.keys(values || {}).sort().forEach(function (v) {
      var o = el("option", { value: v }, v);
      if (v === current) o.selected = true;
      sel.appendChild(o);
    });
  }

  form.addEventListener("submit", function (e) { e.preventDefault(); state.q = input.value.trim(); run(); });
  bookSel.addEventListener("change", function () { state.book = bookSel.value; run(); });
  audSel.addEventListener("change", function () { state.audience = audSel.value; run(); });
  more.addEventListener("click", showMore);
  drawTabs({});

  import(new URL("pagefind/pagefind.js", root).href).then(function (pf) {
    pagefind = pf;
    return pf.options({ baseUrl: root.pathname }).then(function () { return pf.filters(); });
  }).then(function (all) {
    options(bookSel, all.book, state.book);
    options(audSel, all.audience, state.audience);
    run();
  }).catch(function () {
    count.textContent = "Search isn't available in this copy of the site: the deploy builds its index after the render.";
  });
})();
