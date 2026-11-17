-- New Look only (newlook/_quarto-newlook.yml). Adds to each page what
-- scripts/newlook/build_context.py worked out for it, from
-- _newlook/context/<page>.json:
--   * the content-type label in front of the eyebrow above the title;
--   * at the top: Pagefind filters, "Applies to", "Module N of M", "At a glance",
--     the Overview / Build / Train / Labs / Watch / Reference cards and the
--     Microsoft Learn training cards;
--   * at the end: the Related block;
--   * a #gcc-availability anchor on the page's GCC availability section;
--   (Portal-or-code tabs are newlook/newlook-tabs.lua, which has to run earlier.)
-- The pages' text is not changed. Runs after the site's own filters
-- (assets/research-banner.lua, assets/fmw-hero.lua).

local stringify = pandoc.utils.stringify
local ctx = nil

local function load_context()
  if not quarto.doc.is_format("html") then return nil end
  local dir = quarto.project.directory
  local input = quarto.doc.input_file
  if dir == nil or input == nil then return nil end
  dir = dir:gsub("\\", "/")
  input = input:gsub("\\", "/")
  local rel = input:sub(#dir + 2)
  local f = io.open(dir .. "/_newlook/context/" .. rel .. ".json", "r")
  if f == nil then return nil end
  local text = f:read("a")
  f:close()
  local ok, data = pcall(pandoc.json.decode, text, false)
  if ok then return data end
  return nil
end

local function raw(html)
  if html == nil or html == "" then return nil end
  return pandoc.RawBlock("html", html)
end

function Meta(meta)
  ctx = load_context()
  if ctx == nil or ctx["label"] == nil then return nil end
  local label = ctx["label"]
  local current = meta["fmw-eyebrow"] and stringify(meta["fmw-eyebrow"]) or ""
  -- The site name is in the navbar; the label takes its place.
  current = current:gsub("^Federal Modernization Workbook · ", "")
  if current:find(label, 1, true) == 1 then return nil end
  if current == "" or current == "Federal Modernization Workbook" then
    meta["fmw-eyebrow"] = pandoc.Inlines(label)
  else
    meta["fmw-eyebrow"] = pandoc.Inlines(label .. " · " .. current)
  end
  return meta
end

function Pandoc(doc)
  if ctx == nil then return nil end
  local blocks = pandoc.Blocks({})
  local top = raw(ctx["top"])
  if top then blocks:insert(top) end
  local anchor = ctx["gcc_anchor"]
  local placed = false
  for _, b in ipairs(doc.blocks) do
    if not placed and anchor and b.t == "Header" and b.identifier == anchor then
      blocks:insert(pandoc.RawBlock("html", '<span id="gcc-availability" class="nl-anchor"></span>'))
      placed = true
    end
    blocks:insert(b)
  end
  local bottom = raw(ctx["bottom"])
  if bottom then blocks:insert(bottom) end
  doc.blocks = blocks
  return doc
end

return {
  { Meta = Meta },
  { Pandoc = Pandoc },
}
