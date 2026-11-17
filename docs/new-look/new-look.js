// New Look preview (docs/new-look/): the home page tiles and the Browse catalog.
// Reads catalog.json, built by scripts/build_catalog.py. Vanilla JavaScript, no
// libraries. The Browse page keeps its filters in the address (?type=…&role=…&q=…)
// so a filtered view can be shared.
(function () {
  "use strict";

  var ROOT = "../../";
  var GROUPS = [
    { key: "type", label: "Type" },
    { key: "role", label: "Role", field: "roles" },
    { key: "topic", label: "Topic", field: "topics", fold: 8 },
    { key: "level", label: "Level" },
    { key: "status", label: "Status" }
  ];
  var UNIT_ONE = { modules: "module", chapters: "chapter", labs: "lab", videos: "video", gates: "gate", steps: "step" };

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]);
    });
    if (text != null) e.textContent = text;
    return e;
  }

  function duration(min) {
    if (!min) return "";
    var h = Math.floor(min / 60), m = min % 60;
    if (!h) return m + " min";
    return h + " hr" + (m ? " " + m + " min" : "");
  }

  function values(item, g) {
    var v = item[g.field || g.key];
    return Array.isArray(v) ? v : [v];
  }

  function shortTitle(item) {
    return item.type === "Learning path" ? item.title.replace(/^Learning path:\s*/, "") : item.title;
  }

  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

  function card(item) {
    var li = el("li", { "class": "nl-card nl-type-" + slug(item.type) });
    li.appendChild(el("p", { "class": "nl-card-type" }, item.type));
    var h = el("h3", { "class": "nl-card-title" });
    var a = el("a", { href: ROOT + item.url }, shortTitle(item));
    h.appendChild(a);
    li.appendChild(h);
    if (item.description) li.appendChild(el("p", { "class": "nl-card-desc" }, item.description));
    var meta = el("ul", { "class": "nl-card-meta", "aria-label": "Details" });
    if (item.count) meta.appendChild(el("li", null, item.count + " " + (item.count === 1 ? (UNIT_ONE[item.unit] || item.unit) : item.unit)));
    if (item.reading_minutes) meta.appendChild(el("li", null, (item.reading_source === "estimate" ? "About " : "") + duration(item.reading_minutes) + " reading"));
    if (item.video_minutes) meta.appendChild(el("li", null, duration(item.video_minutes) + " of video"));
    if (meta.children.length) li.appendChild(meta);
    var tags = el("p", { "class": "nl-card-tags" });
    if (item.level && item.level !== "Unrated") tags.appendChild(el("span", { "class": "nl-level" }, item.level));
    if (item.status === "Approved" || item.status === "Draft") {
      tags.appendChild(el("span", { "class": "nl-badge nl-badge-" + item.status.toLowerCase() }, item.status));
    }
    if (tags.children.length) li.appendChild(tags);
    return li;
  }

  function load() {
    return fetch("catalog.json").then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }

  // ---------------------------------------------------------------- home page

  function home(cat) {
    var items = cat.items;
    var paths = items.filter(function (i) { return i.type === "Learning path"; });
    var stats = document.getElementById("nl-stats");
    if (stats) {
      var labs = items.filter(function (i) { return i.type === "Lab"; }).reduce(function (n, i) { return n + (i.count || 0); }, 0);
      stats.textContent = items.length + " items: " + paths.length + " learning paths, " + labs + " labs, and every guide, workbook, book and video series.";
    }

    var roles = document.getElementById("nl-roles");
    (cat.roles || []).forEach(function (r) {
      var mine = items.filter(function (i) { return i.roles.indexOf(r.name) >= 0; });
      var mPaths = mine.filter(function (i) { return i.type === "Learning path"; }).length;
      var li = el("li", { "class": "nl-tile" });
      var a = el("a", { href: "browse.html?role=" + encodeURIComponent(r.name) }, r.name);
      var h = el("h3", { "class": "nl-tile-title" });
      h.appendChild(a);
      li.appendChild(h);
      li.appendChild(el("p", { "class": "nl-tile-desc" }, r.blurb));
      li.appendChild(el("p", { "class": "nl-tile-count" }, mPaths + (mPaths === 1 ? " learning path" : " learning paths") + " · " + mine.length + " items"));
      roles.appendChild(li);
    });

    var featured = document.getElementById("nl-featured");
    items.filter(function (i) { return i.featured; }).forEach(function (i) { featured.appendChild(card(i)); });

    var types = document.getElementById("nl-types");
    cat.facets.type.forEach(function (t) {
      var n = items.filter(function (i) { return i.type === t; }).length;
      if (!n) return;
      var li = el("li", { "class": "nl-tile nl-tile-small" });
      var h = el("h3", { "class": "nl-tile-title" });
      h.appendChild(el("a", { href: "browse.html?type=" + encodeURIComponent(t) }, t));
      li.appendChild(h);
      li.appendChild(el("p", { "class": "nl-tile-count" }, n + (n === 1 ? " item" : " items")));
      types.appendChild(li);
    });

    var topics = document.getElementById("nl-topics");
    cat.facets.topic.forEach(function (t) {
      var n = items.filter(function (i) { return i.topics.indexOf(t) >= 0; }).length;
      if (!n) return;
      var li = el("li");
      var a = el("a", { href: "browse.html?topic=" + encodeURIComponent(t), "class": "nl-chip" }, t + " ");
      a.appendChild(el("span", { "class": "nl-chip-count" }, "(" + n + ")"));
      li.appendChild(a);
      topics.appendChild(li);
    });
  }

  // ---------------------------------------------------------------- browse page

  function browse(cat) {
    var items = cat.items;
    var state = { q: "", sort: "type" };
    GROUPS.forEach(function (g) { state[g.key] = []; });

    var params = new URLSearchParams(window.location.search);
    GROUPS.forEach(function (g) {
      params.getAll(g.key).forEach(function (v) {
        v.split(",").forEach(function (x) { x = x.trim(); if (x && cat.facets[g.key].indexOf(x) >= 0) state[g.key].push(x); });
      });
    });
    state.q = params.get("q") || "";
    state.sort = params.get("sort") || (state.q ? "relevance" : "type");

    var search = document.getElementById("nl-search");
    var sort = document.getElementById("nl-sort");
    var count = document.getElementById("nl-count");
    var cards = document.getElementById("nl-cards");
    var active = document.getElementById("nl-active");
    var facets = document.getElementById("nl-facets");
    search.value = state.q;
    sort.value = state.sort;

    function terms() { return state.q.toLowerCase().split(/\s+/).filter(Boolean); }

    function text(i) {
      return [i.title, i.description, i.type, i.level, i.status].concat(i.topics, i.roles).join(" ").toLowerCase();
    }
    items.forEach(function (i) { i._text = text(i); i._title = i.title.toLowerCase(); });

    function score(i) {
      var t = terms();
      if (!t.length) return 1;
      var s = 0;
      for (var k = 0; k < t.length; k++) {
        if (i._text.indexOf(t[k]) < 0) return 0;
        s += i._title.indexOf(t[k]) >= 0 ? 3 : 1;
      }
      return s;
    }

    function passes(i, skip) {
      for (var k = 0; k < GROUPS.length; k++) {
        var g = GROUPS[k];
        if (g.key === skip || !state[g.key].length) continue;
        var vals = values(i, g);
        if (!state[g.key].some(function (v) { return vals.indexOf(v) >= 0; })) return false;
      }
      return true;
    }

    // The filter rail: one collapsible group per facet, checkboxes with counts.
    var boxes = {};
    GROUPS.forEach(function (g) {
      var details = el("details", { "class": "nl-facet", open: "" });
      var summary = el("summary", null, g.label);
      details.appendChild(summary);
      var fs = el("fieldset");
      fs.appendChild(el("legend", { "class": "visually-hidden" }, g.label));
      var list = el("ul", { "class": "nl-facet-list" });
      boxes[g.key] = {};
      cat.facets[g.key].forEach(function (v, idx) {
        var id = "nl-f-" + g.key + "-" + slug(v);
        var li = el("li", { "class": "nl-facet-item" });
        if (g.fold && idx >= g.fold) li.setAttribute("data-fold", "");
        var cb = el("input", { type: "checkbox", id: id, value: v });
        cb.checked = state[g.key].indexOf(v) >= 0;
        cb.addEventListener("change", function () {
          var arr = state[g.key];
          var at = arr.indexOf(v);
          if (cb.checked && at < 0) arr.push(v);
          if (!cb.checked && at >= 0) arr.splice(at, 1);
          update(true);
        });
        var lab = el("label", { "for": id });
        lab.appendChild(el("span", { "class": "nl-facet-name" }, v));
        var c = el("span", { "class": "nl-facet-count" });
        lab.appendChild(c);
        li.appendChild(cb);
        li.appendChild(lab);
        list.appendChild(li);
        boxes[g.key][v] = { box: cb, count: c, li: li };
      });
      fs.appendChild(list);
      if (g.fold && cat.facets[g.key].length > g.fold) {
        list.classList.add("nl-folded");
        var more = el("button", { type: "button", "class": "nl-linkbtn nl-more-btn", "aria-expanded": "false" }, "Show more");
        more.addEventListener("click", function () {
          var open = list.classList.toggle("nl-folded") === false;
          more.setAttribute("aria-expanded", String(open));
          more.textContent = open ? "Show fewer" : "Show more";
        });
        fs.appendChild(more);
      }
      details.appendChild(fs);
      facets.appendChild(details);
    });

    function writeUrl() {
      var p = new URLSearchParams();
      GROUPS.forEach(function (g) { state[g.key].forEach(function (v) { p.append(g.key, v); }); });
      if (state.q) p.set("q", state.q);
      if (state.sort !== (state.q ? "relevance" : "type")) p.set("sort", state.sort);
      var qs = p.toString();
      window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);
    }

    function total(i) { return (i.reading_minutes || 0) + (i.video_minutes || 0); }

    function sorted(list) {
      var by = state.sort;
      var typeOrder = cat.facets.type;
      return list.slice().sort(function (a, b) {
        if (by === "relevance") return (b._score - a._score) || typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || a._title.localeCompare(b._title);
        if (by === "title") return shortTitle(a).localeCompare(shortTitle(b));
        if (by === "short") return (total(a) || 1e9) - (total(b) || 1e9) || a._title.localeCompare(b._title);
        if (by === "long") return total(b) - total(a) || a._title.localeCompare(b._title);
        if (by === "count") return (b.count || 0) - (a.count || 0) || a._title.localeCompare(b._title);
        return typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type) || a._title.localeCompare(b._title);
      });
    }

    function chip(label, onRemove) {
      var li = el("li");
      var b = el("button", { type: "button", "class": "nl-chip nl-chip-remove", "aria-label": "Remove filter: " + label }, label + " ");
      b.appendChild(el("span", { "aria-hidden": "true" }, "×"));
      b.addEventListener("click", onRemove);
      li.appendChild(b);
      return li;
    }

    function update(push) {
      items.forEach(function (i) { i._score = score(i); });
      var matchQ = items.filter(function (i) { return i._score > 0; });
      var shown = sorted(matchQ.filter(function (i) { return passes(i, null); }));

      // Counts: how many results each option would give with the other groups' filters.
      GROUPS.forEach(function (g) {
        var base = matchQ.filter(function (i) { return passes(i, g.key); });
        cat.facets[g.key].forEach(function (v) {
          var n = base.filter(function (i) { return values(i, g).indexOf(v) >= 0; }).length;
          var b = boxes[g.key][v];
          b.count.textContent = String(n);
          b.box.checked = state[g.key].indexOf(v) >= 0;
          b.li.classList.toggle("nl-zero", n === 0 && !b.box.checked);
        });
      });

      cards.textContent = "";
      shown.forEach(function (i) { cards.appendChild(card(i)); });

      var n = shown.length;
      var filtered = state.q || GROUPS.some(function (g) { return state[g.key].length; });
      count.textContent = n + (n === 1 ? " result" : " results") + (filtered ? " of " + items.length : "");
      if (!n) cards.appendChild(el("li", { "class": "nl-empty" }, "Nothing matches. Remove a filter or try other words."));

      active.textContent = "";
      GROUPS.forEach(function (g) {
        state[g.key].forEach(function (v) {
          active.appendChild(chip(g.label + ": " + v, function () {
            state[g.key].splice(state[g.key].indexOf(v), 1);
            update(true);
          }));
        });
      });
      if (state.q) active.appendChild(chip("Search: " + state.q, function () { state.q = ""; search.value = ""; update(true); }));

      sitewide();
      if (push) writeUrl();
    }

    // Hand the words to the New Look's full-text search page (Pagefind).
    var swWrap = document.getElementById("nl-sitewide");
    var swLink = document.getElementById("nl-sitewide-link");
    function sitewide() {
      swWrap.hidden = !state.q;
      if (state.q) {
        swLink.textContent = "Search the full text of every page for “" + state.q + "”";
        swLink.href = "search.html?q=" + encodeURIComponent(state.q);
      }
    }

    var timer;
    search.addEventListener("input", function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var had = !!state.q;
        state.q = search.value.trim();
        if (!had && state.q && state.sort === "type") { state.sort = "relevance"; sort.value = "relevance"; }
        if (had && !state.q && state.sort === "relevance") { state.sort = "type"; sort.value = "type"; }
        update(true);
      }, 150);
    });
    sort.addEventListener("change", function () { state.sort = sort.value; update(true); });
    document.getElementById("nl-clear").addEventListener("click", function () {
      GROUPS.forEach(function (g) { state[g.key] = []; });
      state.q = ""; search.value = "";
      state.sort = "type"; sort.value = "type";
      update(true);
    });

    // Phones: the filter rail opens and closes from a button above the results.
    var toggle = document.getElementById("nl-filter-toggle");
    var rail = document.getElementById("nl-rail");
    toggle.addEventListener("click", function () {
      var open = rail.classList.toggle("nl-rail-open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    update(false);
  }

  function start() {
    var isBrowse = !!document.getElementById("nl-browse");
    var isHome = !!document.getElementById("nl-roles");
    if (!isBrowse && !isHome) return;
    load().then(function (cat) {
      if (isBrowse) browse(cat);
      if (isHome) home(cat);
    }).catch(function () {
      var target = document.getElementById(isBrowse ? "nl-count" : "nl-stats");
      if (target) target.textContent = "The catalog couldn't load. Every item is also listed on the Training, Books and Workbook Map pages.";
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
