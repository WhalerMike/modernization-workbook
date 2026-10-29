-- {{< fmw-video ID >}}: an in-browser player for one narrated video.
--
-- ID is a video in docs/presentations/videos.json (written by
-- scripts/generate_video_manifest.py), for example
-- {{< fmw-video Research_Hybrid_Credentials_Narrated >}}. The MP4 streams from
-- the videos release; the caption track is published with the site, because
-- a <track> must come from the page's own origin. A video with a YouTube ID
-- is embedded from youtube-nocookie.com instead, with the MP4 as the
-- download. In Word the player becomes a link to the video.

local manifest

local function load()
  if manifest then return manifest end
  local path = quarto.project.directory .. "/docs/presentations/videos.json"
  local f = io.open(path, "r")
  if not f then error("fmw-video: " .. path .. " is missing; run scripts/generate_video_manifest.py") end
  local data = quarto.json.decode(f:read("a"))
  f:close()
  manifest = {}
  for _, v in ipairs(data) do manifest[v.id] = v end
  return manifest
end

local function esc(s)
  return (s:gsub("&", "&amp;"):gsub("<", "&lt;"):gsub(">", "&gt;"):gsub('"', "&quot;"))
end

return {
  ["fmw-video"] = function(args)
    local id = pandoc.utils.stringify(args[1])
    local v = load()[id]
    if not v then error("fmw-video: no video '" .. id .. "' in videos.json") end
    if not quarto.doc.is_format("html") then
      local href = v.youtube and ("https://www.youtube.com/watch?v=" .. v.youtube) or v.mp4
      return pandoc.Para({ pandoc.Link("Watch the video: " .. v.title .. " (" .. v.minutes .. " minutes)", href) })
    end
    local root = quarto.project.offset .. "/"
    local title = esc(v.title)
    local player
    if v.youtube then
      player = table.concat({
        '<div style="width:100%;max-width:960px;aspect-ratio:16/9;border:1px solid #dfe5ec;border-radius:6px;overflow:hidden;background:#000">',
        '<iframe src="https://www.youtube-nocookie.com/embed/' .. esc(v.youtube) .. '?rel=0" title="' .. title .. ', a ' .. v.minutes .. '-minute narrated video" style="width:100%;height:100%;border:0" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>',
        '</div>',
      }, "\n")
    else
      player = table.concat({
        '<video controls preload="metadata" playsinline style="width:100%;max-width:960px;height:auto;border:1px solid #dfe5ec;border-radius:6px" aria-label="' .. title .. ', a ' .. v.minutes .. '-minute narrated video">',
        '<source src="' .. esc(v.mp4) .. '" type="video/mp4">',
        '<track kind="captions" src="' .. esc(root .. v.vtt) .. '" srclang="en" label="English">',
        'Your browser can\'t play this video. <a href="' .. esc(v.mp4) .. '">Download the MP4</a>.',
        '</video>',
      }, "\n")
    end
    local html = table.concat({
      '<figure class="fmw-video">',
      player,
      '<figcaption style="font-size:.9rem;color:#475569">' .. title .. ' · ' .. v.minutes .. ' minutes · captions from the player\'s CC button · ',
      '<a href="' .. esc(v.mp4) .. '">Download MP4</a> · ',
      '<a href="' .. esc(root .. "docs/presentations/watch.html?v=" .. v.id) .. '">All videos</a></figcaption>',
      '</figure>',
    }, "\n")
    return pandoc.RawBlock("html", html)
  end,
}
