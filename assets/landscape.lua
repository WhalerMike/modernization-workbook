-- Table layout for the Word editions (the per-page .docx downloads and the book bundles).
--
-- 1. Landscape blocks. Wrap content in ::: {.landscape} ... ::: and the .docx gets a section break
--    before it (ending a portrait section) and after it (ending a landscape section), so the wrapped
--    content prints on landscape pages. The HTML side is CSS (.landscape in assets/fmw-theme.scss).
-- 2. Balanced column widths. Word otherwise gives every column of a pipe table the same share of the
--    page, so a long-text column wraps one word per line beside near-empty short columns. A table whose
--    columns are all the same width (or unset) gets widths sized to its content instead: each column's
--    share follows its typical cell length, with a floor so short headers don't break mid-word. Tables
--    whose author set unequal widths on purpose are left alone.
-- 3. Automatic landscape. A table with 7 or more columns, or 5 or more with heavy text, goes on
--    landscape pages of its own; everything else stays portrait.
-- 4. Smaller type for large tables. Landscape tables, tables of 6 or more columns and text-heavy
--    tables set their cell text in the "Table Small" character style (10 pt; body text is 12 pt),
--    and their columns are balanced for the extra width that gives.
--
-- The added sections number footnotes continuously, like the reference document.

if not FORMAT:match("docx") then
  return {}
end

local PORTRAIT = '<w:pgSz w:w="12240" w:h="15840"/>'
  .. '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>'
local LANDSCAPE = '<w:pgSz w:w="15840" w:h="12240" w:orient="landscape"/>'
  .. '<w:pgMar w:top="1080" w:right="1080" w:bottom="1080" w:left="1080" w:header="720" w:footer="720" w:gutter="0"/>'

local function section_end(page)
  return pandoc.RawBlock("openxml",
    '<w:p><w:pPr><w:sectPr><w:footnotePr><w:numRestart w:val="continuous"/></w:footnotePr>'
    .. page .. '</w:sectPr></w:pPr></w:p>')
end

local KEEP = "fmw-no-auto-landscape"   -- marks tables already inside a landscape block

-- Pass 1: landscape blocks, marking their tables so pass 2 doesn't wrap them again.
local function landscape_div(el)
  if not el.classes:includes("landscape") then
    return nil
  end
  el = el:walk({ Table = function(t) t.attr.classes:insert(KEEP); return t end })
  local blocks = { section_end(PORTRAIT) }
  for _, b in ipairs(el.content) do
    table.insert(blocks, b)
  end
  table.insert(blocks, section_end(LANDSCAPE))
  return blocks
end

-- Per column: mean cell length, and the longest single word (header words count a little wider,
-- because headers are bold).
local function measure(tbl)
  local n = #tbl.colspecs
  local lens, longest = {}, {}
  for i = 1, n do lens[i] = {}; longest[i] = 0 end
  local function add_row(row, bold)
    for i, cell in ipairs(row.cells) do
      if i <= n then
        local text = pandoc.utils.stringify(cell.contents)
        table.insert(lens[i], #text)
        for word in text:gmatch("%S+") do
          local w = bold and math.ceil(#word * 1.3) or #word
          if w > longest[i] then longest[i] = w end
        end
      end
    end
  end
  for _, row in ipairs(tbl.head.rows) do add_row(row, true) end
  for _, body in ipairs(tbl.bodies) do
    for _, row in ipairs(body.body) do add_row(row, false) end
  end
  local mean = {}
  for i = 1, n do
    local sum = 0
    for _, v in ipairs(lens[i]) do sum = sum + v end
    mean[i] = #lens[i] > 0 and sum / #lens[i] or 0
  end
  return mean, longest, lens
end

-- Widths were set deliberately if they are numbers and not all equal.
local function widths_set_on_purpose(tbl)
  local first
  for _, spec in ipairs(tbl.colspecs) do
    local w = spec[2]
    if type(w) ~= "number" then return false end
    if first == nil then first = w elseif math.abs(w - first) > 0.001 then return true end
  end
  return false
end

-- Characters of table text that fit across the page: portrait, landscape; and the gain from the
-- 10 pt "Table Small" style over the 12 pt body text.
local PORTRAIT_CHARS, LANDSCAPE_CHARS, SMALL_GAIN = 88, 125, 1.2
local SMALL = "Table Small"

-- Set every cell's text in the small table style.
local function shrink(tbl)
  return tbl:walk({
    Plain = function(b) return pandoc.Plain({ pandoc.Span(b.content, { ["custom-style"] = SMALL }) }) end,
    Para = function(b) return pandoc.Para({ pandoc.Span(b.content, { ["custom-style"] = SMALL }) }) end,
  })
end

-- Every column gets room for its longest word (so nothing breaks mid-word); the space left over goes
-- to the columns whose cells are longer than that, in proportion to how much longer.
local function shares(mean, longest, capacity)
  local n = #mean
  local minw, extra, sum_min, sum_extra = {}, {}, 0, 0
  for i = 1, n do
    minw[i] = math.max(longest[i] + 2, 5)
    extra[i] = math.max(mean[i] - minw[i], 0)
    sum_min = sum_min + minw[i]
    sum_extra = sum_extra + extra[i]
  end
  local spare = math.max(capacity - sum_min, 0)
  local out = {}
  for i = 1, n do
    local w = minw[i] + (sum_extra > 0 and spare * extra[i] / sum_extra or spare / n)
    out[i] = w
  end
  local total = 0
  for i = 1, n do total = total + out[i] end
  for i = 1, n do out[i] = out[i] / total end
  return out, sum_min
end

-- Pass 2: balance each table's columns; put wide or crowded ones on landscape pages.
local function layout_table(tbl)
  local n = #tbl.colspecs
  if n < 3 or widths_set_on_purpose(tbl) then return tbl end
  local mean, longest, lens = measure(tbl)
  local _, sum_min = shares(mean, longest, PORTRAIT_CHARS)
  local chars, rows = 0, 0
  for i = 1, n do
    for _, v in ipairs(lens[i]) do chars = chars + v end
    rows = math.max(rows, #lens[i])
  end
  local inside_landscape = tbl.attr.classes:includes(KEEP)
  -- Landscape when there are many columns, when the short columns alone take most of a portrait
  -- page, or when rows carry a lot of text.
  local wide = n >= 7 or (n >= 5 and (sum_min > 0.6 * PORTRAIT_CHARS or (rows > 0 and chars / rows > 260)))
  local landscape = inside_landscape or wide
  local small = landscape or n >= 6 or (rows > 0 and chars / rows > 180)
  local capacity = (landscape and LANDSCAPE_CHARS or PORTRAIT_CHARS) * (small and SMALL_GAIN or 1)
  local w = shares(mean, longest, capacity)
  for i = 1, n do tbl.colspecs[i] = { tbl.colspecs[i][1], w[i] } end
  if small then tbl = shrink(tbl) end
  if inside_landscape or not wide then return tbl end
  return { section_end(PORTRAIT), tbl, section_end(LANDSCAPE) }
end

return { { Div = landscape_div }, { Table = layout_table } }
