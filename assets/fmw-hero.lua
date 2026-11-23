-- Page header for the Federal Modernization Workbook (HTML only).
--
-- Works with assets/partials/title-block.html:
--   * fmw-eyebrow: the small label above the title ("Book 01 · Why").
--   * Pages repeat their title as the first "# " heading. When that heading
--     matches the title it is dropped, so the title shows once; when it
--     extends the title ("Book 11 — Zero Trust & Assessment: A Whole-Agency
--     Property"), the extra words become fmw-tagline under the title.
--   * A chapter's opening italic sentence, directly after that heading,
--     becomes a .fmw-lede block.

local stringify = pandoc.utils.stringify

local function norm(s)
  return (s:gsub("%s+", " "):gsub("^ ", ""):gsub(" $", ""))
end

local function only_emph(block)
  if block.t ~= "Para" then return false end
  local seen = false
  for _, el in ipairs(block.content) do
    if el.t == "Emph" then
      if seen then return false end
      seen = true
    elseif el.t ~= "Space" and el.t ~= "SoftBreak" then
      return false
    end
  end
  return seen
end

function Pandoc(doc)
  if not quarto.doc.is_format("html") then return doc end
  local meta = doc.meta

  if meta["fmw-eyebrow"] == nil then
    local book = meta.book and stringify(meta.book) or ""
    local num = book:match("^B(%d%d)$")
    local parts = { "Federal Modernization Workbook" }
    if num then
      table.insert(parts, "Book " .. num)
      if meta.part then table.insert(parts, stringify(meta.part)) end
    end
    meta["fmw-eyebrow"] = pandoc.Inlines(table.concat(parts, " · "))
  end

  -- Section landing pages (the books index, each book's landing page, Presentations,
  -- Research, Start Here) get the dark header: black with white text.
  if meta["doc-type"] and stringify(meta["doc-type"]) == "section-landing" then
    meta["fmw-hero-dark"] = true
    -- A book's landing page (docs/books/<book>/index.md) shows its cover illustration
    -- in the dark header when docs/images/covers/<book>.svg exists
    -- (scripts/covers/build_covers.py draws them).
    local input = (quarto.doc.input_file or ""):gsub("\\", "/")
    local folder = input:match("docs/books/(b%d%d%-[%w%-]+)/index%.md$")
    if folder then
      local cover = "docs/images/covers/" .. folder .. ".svg"
      local root = quarto.project.directory or "."
      local f = io.open(pandoc.path.join({ root, cover }), "r")
      if f then
        f:close()
        meta["fmw-cover"] = "../../images/covers/" .. folder .. ".svg"
      end
    end
  end

  -- A chapter page (docs/books/<book>/<chapter>.md) shows its opener illustration
  -- across the top of its header when docs/images/openers/<book>/<chapter>.svg exists
  -- (scripts/covers/build_openers.py draws them).
  if meta["fmw-cover"] == nil then
    local input = (quarto.doc.input_file or ""):gsub("\\", "/")
    local folder, chapter = input:match("docs/books/(b%d%d%-[%w%-]+)/([%w%-]+)%.md$")
    if folder and chapter ~= "index" then
      local opener = "docs/images/openers/" .. folder .. "/" .. chapter .. ".svg"
      local root = quarto.project.directory or "."
      local f = io.open(pandoc.path.join({ root, opener }), "r")
      if f then
        f:close()
        meta["fmw-cover"] = "../../images/openers/" .. folder .. "/" .. chapter .. ".svg"
        meta["fmw-cover-class"] = "fmw-opener"
      end
    end
  end

  local title = meta.title and norm(stringify(meta.title)) or nil
  if not title then return doc end

  for i, block in ipairs(doc.blocks) do
    if block.t == "Header" and block.level == 1 then
      local text = norm(stringify(block.content))
      local rest = nil
      if text == title then
        rest = ""
      elseif text:sub(1, #title + 1) == title .. ":" then
        rest = norm(text:sub(#title + 2))
      end
      if rest ~= nil then
        doc.blocks:remove(i)
        if rest ~= "" and meta["fmw-tagline"] == nil then
          meta["fmw-tagline"] = pandoc.Inlines(rest)
        end
        local nxt = doc.blocks[i]
        if nxt and only_emph(nxt) then
          doc.blocks[i] = pandoc.Div({ nxt }, pandoc.Attr("", { "fmw-lede" }))
        end
      end
      break
    end
  end
  doc.meta = meta
  return doc
end
