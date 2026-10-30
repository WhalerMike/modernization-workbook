---
title: "Videos"
subtitle: "Every narrated briefing, deep dive and research deck, playable in the browser with captions"
description: "The Federal Modernization Workbook's video library: every narrated presentation, executive briefing, technical deep dive and research deck, playable in the browser with English captions, or downloadable as an MP4."
doc-type: section-landing
fmw-eyebrow: "Videos"
---

# Videos {.unnumbered}

```{=html}
<div id="fmw-player" data-fmw-player style="margin-bottom:1.5rem">
  <h2 id="fmw-player-title" class="anchored" style="margin-top:0">Loading…</h2>
  <video id="fmw-player-video" controls preload="metadata" playsinline style="width:100%;max-width:960px;height:auto;border:1px solid #dfe5ec;border-radius:6px;background:#000">
    <track id="fmw-player-track" kind="captions" srclang="en" label="English">
  </video>
  <div id="fmw-player-yt" hidden style="width:100%;max-width:960px;aspect-ratio:16/9;border:1px solid #dfe5ec;border-radius:6px;overflow:hidden;background:#000">
    <iframe id="fmw-player-frame" style="width:100%;height:100%;border:0" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>
  </div>
  <p id="fmw-player-links" style="font-size:.9rem;color:#475569;margin-bottom:.25rem"></p>
  <details id="fmw-player-chapters" hidden style="font-size:.9rem"><summary></summary><ol style="margin:.25rem 0 0;padding-left:1.5rem"></ol></details>
</div>
<noscript><p>The player needs JavaScript. Every video below can also be downloaded as an MP4.</p></noscript>
<script src="fmw-chapters.js" defer></script>
<script>
(function () {
  var params = new URLSearchParams(window.location.search);
  var wanted = params.get("v") || "Start_Here_Narrated";
  var title = document.getElementById("fmw-player-title");
  var video = document.getElementById("fmw-player-video");
  var track = document.getElementById("fmw-player-track");
  var links = document.getElementById("fmw-player-links");
  var yt = document.getElementById("fmw-player-yt");
  var frame = document.getElementById("fmw-player-frame");
  function link(href, text) {
    var a = document.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  fetch("videos.json")
    .then(function (r) { return r.json(); })
    .then(function (list) {
      var v = list.filter(function (x) { return x.id === wanted; })[0];
      if (!v) {
        title.textContent = "That video isn't in the library";
        video.hidden = true;
        links.textContent = "Choose one from the list below.";
        return;
      }
      title.textContent = v.title;
      document.title = v.title + " – Federal Modernization Workbook";
      var label = v.title + ", a " + v.minutes + "-minute narrated video";
      if (v.youtube) {
        // YouTube plays everywhere, Safari and iOS included; the MP4 stays the download.
        video.hidden = true;
        yt.hidden = false;
        frame.title = label;
        frame.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(v.youtube) + "?rel=0&enablejsapi=1";
      } else {
        video.setAttribute("aria-label", label);
        video.src = v.mp4;
        track.src = "../../" + v.vtt;
      }
      links.textContent = v.minutes + " minutes · captions from the player's CC button · ";
      links.appendChild(link(v.mp4, "Download MP4"));
      if (v.youtube) { links.appendChild(document.createTextNode(" · ")); links.appendChild(link("https://www.youtube.com/watch?v=" + v.youtube, "Watch on YouTube")); }
      if (v.deck) { links.appendChild(document.createTextNode(" · ")); links.appendChild(link("../../" + v.deck, "Narrated deck")); }
      if (v.script) { links.appendChild(document.createTextNode(" · ")); links.appendChild(link(v.script, "Script")); }
      if (v.chapters) {
        // One button per slide; fmw-chapters.js jumps the player to it.
        var chapters = document.getElementById("fmw-player-chapters");
        var list = chapters.querySelector("ol");
        chapters.querySelector("summary").textContent = "Jump to a slide (" + v.chapters.length + ")";
        v.chapters.forEach(function (c) {
          var b = document.createElement("button");
          b.type = "button";
          b.className = "btn btn-link p-0 text-start";
          b.setAttribute("data-fmw-t", c[0]);
          b.textContent = Math.floor(c[0] / 60) + ":" + String(c[0] % 60).padStart(2, "0") + " " + c[1];
          var li = document.createElement("li");
          li.appendChild(b);
          list.appendChild(li);
        });
        chapters.hidden = false;
      }
      if (params.get("v")) { document.getElementById("fmw-player").scrollIntoView(); }
    })
    .catch(function () {
      title.textContent = "The player couldn't load";
      links.textContent = "Every video below can still be downloaded as an MP4.";
    });
})();
</script>
```

Choose any video below to play it here. Each one plays from the workbook's YouTube channel, or streams from its [video release](https://github.com/WhalerMike/modernization-workbook/releases/tag/videos-2026-10-23), with English captions from the player's CC button, and each can be downloaded as an MP4 to watch offline. The decks themselves, for presenting live, are on the [Presentations](index.md) page.

## The library

{{< include _video-library.md >}}
