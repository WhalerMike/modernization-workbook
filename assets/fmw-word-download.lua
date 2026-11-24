-- "Download (Word)" under the title of every page that has a built Word file (HTML only).
--
-- assets/word-downloads.json maps each page (its repository path) to its chapter file and, when
-- the page is part of a larger Word edition, that edition's file and title. It is written by
-- `python scripts/build_bundles.py --word-index` from scripts/bundles.yml. The deploy builds the
-- files themselves (build_bundles.py --chapters _site): the chapter file sits next to the page as
-- <page>.docx, the edition under downloads/. This filter sets fmw-word, and
-- assets/partials/title-block.html shows it.

local index = nil

local function load()
  if index ~= nil then return index end
  index = {}
  local root = quarto.project.directory or "."
  local f = io.open(pandoc.path.join({ root, "assets", "word-downloads.json" }), "r")
  if f then
    local text = f:read("a")
    f:close()
    local ok, data = pcall(pandoc.json.decode, text, false)
    if ok and type(data) == "table" then index = data end
  end
  return index
end

function Meta(meta)
  if not quarto.doc.is_format("html") then return nil end
  local root = (quarto.project.directory or ""):gsub("\\", "/")
  local input = (quarto.doc.input_file or ""):gsub("\\", "/")
  if root ~= "" and input:sub(1, #root) == root then
    input = input:sub(#root + 2)
  end
  local entry = load()[input]
  if type(entry) ~= "table" or not entry.page then return nil end
  local word = { page = pandoc.MetaString(entry.page) }
  if entry.bundle then
    -- From the page's folder back to the site root.
    local _, depth = input:gsub("/", "")
    word.bundle = pandoc.MetaString(string.rep("../", depth) .. "downloads/" .. entry.bundle)
    word["bundle-title"] = pandoc.MetaInlines({ pandoc.Str(entry.title) })
  end
  meta["fmw-word"] = pandoc.MetaMap(word)
  return meta
end
