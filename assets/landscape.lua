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
-- 5. Code names don't widen a column: a long one (msDS-GroupManagedServiceAccount) wraps, so the
--    other columns keep room for their longest words.
-- 6. Captions lose their "{.striped .hover}" attributes, which Word would print as text.
-- (Rows that don't split across pages, the bold header row and the grey banding are in the Table
-- style of assets/reference-mslearn.docx.)
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

local CODE_CAP = 14
local CELL_PAD = 3

-- Per column: mean cell length, and the longest single word (header words count 10% wider,
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
        local function word_width(word, cap)
          local w = bold and math.ceil(#word * 1.1) or #word
          if cap and w > cap then w = cap end
          if w > longest[i] then longest[i] = w end
        end
        -- Ordinary words set the column's floor, so they never break mid-word. A code name
        -- (msDS-GroupManagedServiceAccount, a cmdlet with its parameters) wraps instead: it counts
        -- for at most CODE_CAP characters, or one long name would starve every other column.
        -- Footnotes print at the foot of the page, not in the cell, so their text is skipped.
        local bare = pandoc.Div(cell.contents):walk({ Note = function() return {} end })
        bare:walk({
          Str = function(el) word_width(el.text) end,
          Code = function(el)
            for word in el.text:gmatch("%S+") do word_width(word, CODE_CAP) end
          end,
        })
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
    -- Each cell also loses its left and right padding (the Table style's 108 twips a side, about
    -- CELL_PAD characters), the same for every column, so it counts toward each column's share.
    minw[i] = math.max(longest[i] + 1, 5) + CELL_PAD
    extra[i] = math.max(mean[i] + CELL_PAD - minw[i], 0)
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

-- A caption written ": Title {.striped .hover}" keeps its attributes as text in Word (the site reads
-- them as classes). Drop a trailing "{...}" group from the caption.
local function clean_caption(tbl)
  local long = tbl.caption and tbl.caption.long
  if not long or #long == 0 then return end
  local last = long[#long]
  if last.t ~= "Plain" and last.t ~= "Para" then return end
  local inl = last.content
  local start
  for j = #inl, 1, -1 do
    if inl[j].t == "Str" and inl[j].text:match("^{") then start = j; break end
  end
  if not start then return end
  local tail = pandoc.utils.stringify(pandoc.Inlines({ table.unpack(inl, start) }))
  if not tail:match("^{[^}]*}$") then return end
  for _ = #inl, start, -1 do inl:remove() end
  while #inl > 0 and (inl[#inl].t == "Space" or inl[#inl].t == "SoftBreak") do inl:remove() end
end

-- Pass 2: balance each table's columns; put wide or crowded ones on landscape pages.
local function layout_table(tbl)
  clean_caption(tbl)
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
  local wide = n >= 7 or (n >= 5 and (sum_min - n * CELL_PAD > 0.6 * PORTRAIT_CHARS or (rows > 0 and chars / rows > 260)))
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
