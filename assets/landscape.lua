-- Landscape sections for wide tables in the Word editions.
--
-- Wrap the content in ::: {.landscape} ... ::: and the .docx gets a section break
-- before it (ending a portrait section) and after it (ending a landscape section),
-- so the wrapped content prints on landscape pages. The HTML side is CSS
-- (.landscape in assets/fmw-theme.scss names a landscape print page).
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

function Div(el)
  if not el.classes:includes("landscape") then
    return nil
  end
  local blocks = { section_end(PORTRAIT) }
  for _, b in ipairs(el.content) do
    table.insert(blocks, b)
  end
  table.insert(blocks, section_end(LANDSCAPE))
  return blocks
end

return { { Div = Div } }
