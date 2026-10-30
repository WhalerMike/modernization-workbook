// Slide chapters for the video players: the Watch page and the fmw-video shortcode
// (assets/fmw-video.lua). A button with data-fmw-t="<seconds>" inside a
// [data-fmw-player] element jumps that player to the slide: the YouTube embed
// through its postMessage API (the iframe's src carries enablejsapi=1), or the
// <video> fallback directly.
(function () {
  if (window.fmwChapters) { return; }
  window.fmwChapters = true;
  function send(frame, func, args) {
    frame.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: args || [] }), "*");
  }
  document.addEventListener("click", function (e) {
    var button = e.target.closest("[data-fmw-t]");
    if (!button) { return; }
    var player = button.closest("[data-fmw-player]");
    if (!player) { return; }
    var t = Number(button.getAttribute("data-fmw-t"));
    var frame = player.querySelector("iframe");
    var video = player.querySelector("video");
    if (frame && !frame.closest("[hidden]")) {
      send(frame, "seekTo", [t, true]);
      send(frame, "playVideo");
      frame.scrollIntoView({ block: "nearest", behavior: "smooth" });
    } else if (video && !video.hidden) {
      video.currentTime = t;
      video.play();
      video.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  });
})();
