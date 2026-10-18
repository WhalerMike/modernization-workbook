-- Pandoc Lua filter for the SQL Server narrative Word bundle.
--
-- The bundle is built by passing the series' source Markdown straight to
-- pandoc (see scripts/build_sql_bundle.py). These pages are written
-- for the website, so a few web-only pieces have to be dropped or flattened
-- for a single Word document:
--   * Quarto listing placeholders (#chapters, #book-chapters) render empty
--     outside Quarto, so they are removed together with the heading that
--     introduces them ("Chapters", "Reading sequence").
--   * Navigation and download callouts ("Continue the series",
--     "Download this book", "Download the full section") point at web pages
--     or files that do not exist inside the bundle.
--   * Links to other .md pages cannot resolve inside one .docx, so they are
--     replaced by their link text.

local listing_ids = { ["chapters"] = true, ["book-chapters"] = true }

local nav_callout_titles = {
  "^Continue the series",
  "^Download this book",
  "^Download the full section",
}

local function is_listing(block)
  return block.t == "Div" and listing_ids[block.identifier] == true
end

local function is_nav_callout(block)
  if block.t ~= "Div" then return false end
  local is_callout = false
  for _, c in ipairs(block.classes) do
    if c:match("^callout") then is_callout = true end
  end
  if not is_callout then return false end
  local text = pandoc.utils.stringify(block)
  for _, pat in ipairs(nav_callout_titles) do
    if text:match(pat) then return true end
  end
  return false
end

local function filter_blocks(blocks)
  local out = pandoc.List()
  local i = 1
  while i <= #blocks do
    local b = blocks[i]
    local nextb = blocks[i + 1]
    if b.t == "Header" and nextb and is_listing(nextb) then
      i = i + 2                       -- drop heading + empty listing
    elseif is_listing(b) or is_nav_callout(b) then
      i = i + 1
    else
      out:insert(b)
      i = i + 1
    end
  end
  return out
end

-- Images: scripts/build_sql_bundle.py writes a JSON map (path given in
-- BUNDLE_IMAGE_MAP) from source image paths to Word-ready copies, e.g. an SVG
-- converted to PNG or a JPEG that was saved with a .png extension.
local image_map = {}
local map_path = os.getenv("BUNDLE_IMAGE_MAP")
if map_path then
  local fh = io.open(map_path, "r")
  if fh then
    image_map = pandoc.json.decode(fh:read("a")) or {}
    fh:close()
  end
end

-- Absolute path with "." and ".." segments collapsed (matches Python's
-- Path.resolve() for paths without symlinks).
local function absolute(path)
  if path:sub(1, 1) ~= "/" then
    path = pandoc.system.get_working_directory() .. "/" .. path
  end
  local parts = {}
  for seg in path:gmatch("[^/]+") do
    if seg == ".." then
      table.remove(parts)
    elseif seg ~= "." then
      table.insert(parts, seg)
    end
  end
  return "/" .. table.concat(parts, "/")
end

function Image(el)
  local mapped = image_map[absolute(el.src)]
  if mapped then el.src = mapped end
  return el
end

function Link(el)
  local target = el.target or ""
  local external = target:match("^%a[%w+.-]*:") ~= nil
  if not external and (target:match("%.md$") or target:match("%.md#")) then
    return el.content
  end
end

function Pandoc(doc)
  doc.blocks = filter_blocks(doc.blocks)
  -- Nested blocks (e.g. listings inside other divs) are handled too.
  doc = doc:walk({ Div = function(d) d.content = filter_blocks(d.content); return d end })
  return doc
end
