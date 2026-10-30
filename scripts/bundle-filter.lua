-- Pandoc Lua filter for the site's Word bundles (scripts/build_bundles.py).
--
-- Bundles are built by passing the source Markdown straight to pandoc. The
-- pages are written for the website, so web-only pieces are dropped or
-- flattened for a single Word document:
--   * Quarto listing placeholders render empty outside Quarto, so they are
--     removed together with the heading that introduces them. Their ids come
--     from the pages' front matter (BUNDLE_LISTING_IDS).
--   * "Continue the series" and "Continue the book" callouts are removed. In "Download ..." callouts
--     the heading and the paragraph with the download link are removed; the
--     callout is kept only if other text remains.
--   * Quarto conditional content: `.content-visible when-format="docx"` is
--     kept, content meant only for other formats is dropped.
--   * A callout's `title` attribute becomes a bold first line.
--   * Links to other site pages or files cannot resolve inside a downloaded
--     .docx, so relative links become plain text. External links and links
--     to headings (#...) are kept.
--   * Images are pointed at Word-ready copies (BUNDLE_IMAGE_MAP).
--   * Footnotes become chapter endnotes: each chapter (a level-1 heading)
--     ends with a "Notes" section, numbered from 1 per chapter, and each
--     reference is a superscript number linked to its note. A note cited
--     more than once in a chapter is listed once.

local listing_ids = {}
for id in (os.getenv("BUNDLE_LISTING_IDS") or "chapters,book-chapters"):gmatch("[^,]+") do
  listing_ids[id] = true
end

local function has_class(el, pattern)
  for _, c in ipairs(el.classes) do
    if c:match(pattern) then return true end
  end
  return false
end

local function is_listing(block)
  return block.t == "Div" and listing_ids[block.identifier] == true
end

local function callout_title(block)
  local title = block.attributes["title"]
  if title then return title end
  local first = block.content[1]
  if first and first.t == "Header" then return pandoc.utils.stringify(first) end
  return ""
end

local function is_external(target)
  return target:match("^%a[%w+.-]*:") ~= nil
end

local function mentions_download(block)
  local found = false
  block:walk({
    Link = function(l)
      if l.target:match("downloads/") or l.target:match("%.docx$") or l.target:match("%.zip$") then
        found = true
      end
    end,
    Str = function(s)
      if s.text:match("[Bb]undle%.docx") then found = true end
    end,
  })
  return found
end

local function format_matches(value)
  if not value then return nil end
  for f in value:gmatch("[^%s,]+") do
    if f == "docx" or f == "word" then return true end
  end
  return false
end

-- Returns nil to drop the block, or the (possibly changed) block.
local function transform(block)
  if block.t ~= "Div" then return block end
  if is_listing(block) then return nil end
  -- Quarto conditional content
  if has_class(block, "^content%-visible$") then
    local when, unless = format_matches(block.attributes["when-format"]), format_matches(block.attributes["unless-format"])
    if when == false or unless == true then return nil end
  elseif has_class(block, "^content%-hidden$") then
    local when, unless = format_matches(block.attributes["when-format"]), format_matches(block.attributes["unless-format"])
    if when == true or (when == nil and unless == nil) or unless == false then return nil end
  end
  if has_class(block, "^callout") then
    local title = callout_title(block)
    if title:match("^Continue the series") or title:match("^Continue the book") then return nil end
    if title:match("^Download") then
      local kept = pandoc.List()
      for i, b in ipairs(block.content) do
        if not (i == 1 and b.t == "Header") and not mentions_download(b) then kept:insert(b) end
      end
      if #kept == 0 then return nil end
      block.content = kept
      block.attributes["title"] = nil
      return block
    end
    if block.attributes["title"] then
      block.content:insert(1, pandoc.Para({ pandoc.Strong(pandoc.Inlines(block.attributes["title"])) }))
      block.attributes["title"] = nil
    end
  end
  return block
end

local function filter_blocks(blocks)
  local out = pandoc.List()
  local i = 1
  while i <= #blocks do
    local b = blocks[i]
    local nextb = blocks[i + 1]
    if b.t == "Header" and nextb and is_listing(nextb) then
      i = i + 2                       -- heading + empty listing
    else
      local t = transform(b)
      if t then out:insert(t) end
      i = i + 1
    end
  end
  return out
end

local image_map = {}
local map_path = os.getenv("BUNDLE_IMAGE_MAP")
if map_path then
  local fh = io.open(map_path, "r")
  if fh then
    image_map = pandoc.json.decode(fh:read("a")) or {}
    fh:close()
  end
end

-- Absolute path with "." and ".." collapsed and "/" as the separator, the
-- form build_bundles.py writes its map keys in. On Windows pandoc hands over
-- "C:\...\page-dir/../img.png", so backslashes are converted and a drive
-- letter counts as absolute.
local function absolute(path)
  path = path:gsub("\\", "/")
  local function is_abs(p) return p:sub(1, 1) == "/" or p:match("^%a:/") ~= nil end
  if not is_abs(path) then
    path = pandoc.system.get_working_directory():gsub("\\", "/") .. "/" .. path
  end
  local drive = path:match("^(%a:)/")
  local parts = {}
  for seg in path:sub(drive and 3 or 1):gmatch("[^/]+") do
    if seg == ".." then
      table.remove(parts)
    elseif seg ~= "." then
      table.insert(parts, seg)
    end
  end
  return (drive or "") .. "/" .. table.concat(parts, "/")
end

local function unescape(s)
  return (s:gsub("%%(%x%x)", function(h) return string.char(tonumber(h, 16)) end))
end

local function Image(el)
  if el.src:match("^data:") then return el end
  local mapped = image_map[absolute(unescape(el.src))]
  if mapped then el.src = mapped end
  return el
end

local function Link(el)
  local target = el.target or ""
  if target:sub(1, 1) == "#" or is_external(target) then return nil end
  return el.content
end

local function Pandoc(doc)
  -- Inner divs first, so nested listings and callouts are handled too.
  doc = doc:walk({ Div = function(d) d.content = filter_blocks(d.content); return d end })
  doc.blocks = filter_blocks(doc.blocks)
  return doc
end

-- Chapter endnotes. Runs last, after links are flattened, so the links to
-- the notes survive.
local function Endnotes(doc)
  local out = pandoc.Blocks({})
  local chapter, notes, seen = 0, {}, {}

  local function anchor(n) return "note-" .. chapter .. "-" .. n end

  local function flush()
    if #notes == 0 then return end
    out:insert(pandoc.Header(2, { pandoc.Str("Notes") }, pandoc.Attr("", { "unnumbered" })))
    local items = {}
    for n, blocks in ipairs(notes) do
      items[n] = { pandoc.Div(blocks, pandoc.Attr(anchor(n))) }
    end
    out:insert(pandoc.OrderedList(items))
    notes, seen = {}, {}
  end

  for _, block in ipairs(doc.blocks) do
    if block.t == "Header" and block.level == 1 then
      flush()
      chapter = chapter + 1
    end
    out:insert(block:walk({
      Note = function(note)
        local key = pandoc.utils.stringify(note.content)
        local n = seen[key]
        if not n then
          table.insert(notes, note.content)
          n = #notes
          seen[key] = n
        end
        return pandoc.Superscript({ pandoc.Link({ pandoc.Str(tostring(n)) }, "#" .. anchor(n)) })
      end,
    }))
  end
  flush()
  doc.blocks = out
  return doc
end

-- Passes, in order. Block removal runs first so that download callouts are
-- still recognised by their links; links are flattened to text afterwards.
-- (In a single filter pandoc visits inlines before Pandoc, so the links were
-- already gone and link-only paragraphs such as "One chapter at a time: 00 ·
-- 01 · ..." survived as bare numbers.)
return {
  { Pandoc = Pandoc },
  { Image = Image, Link = Link },
  { Pandoc = Endnotes },
}
