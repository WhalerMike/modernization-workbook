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
