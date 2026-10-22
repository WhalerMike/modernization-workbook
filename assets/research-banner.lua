-- Research pages (docs/research/) carry `research-status` in their front matter
-- (draft, in review, promoted). This filter labels them so a reader never
-- mistakes research under review for a workbook book:
--   * the eyebrow above the title reads "Research · <status>";
--   * an "under review" callout opens the page.
-- Pages without `research-status` are left alone.

local stringify = pandoc.utils.stringify

local LABEL = {
  ["draft"] = "Draft",
  ["in review"] = "In review",
  ["promoted"] = "Promoted",
}

local status

function Meta(meta)
  if meta["research-status"] == nil then return nil end
  local raw = stringify(meta["research-status"]):lower()
  status = LABEL[raw] or stringify(meta["research-status"])
  meta["fmw-eyebrow"] = pandoc.Inlines("Research · " .. status)
  return meta
end

function Pandoc(doc)
  if status == nil or not quarto.doc.is_format("html") then return nil end
  local text
  if status == "Promoted" then
    text = "This research has been reviewed and its findings moved into the workbook. The page is kept for its sources and history."
  else
    text = "This is research under review, not part of the workbook books. Its analysis and any recommendation are the program's own working view; they may change before review is complete, and they are not endorsed by any federal agency."
  end
  local callout = pandoc.Div(
    { pandoc.Header(2, "Research — " .. status), pandoc.Para(pandoc.Str(text)) },
    { class = "callout-warning" }
  )
  table.insert(doc.blocks, 1, callout)
  return doc
end

return {
  { Meta = Meta },
  { Pandoc = Pandoc },
}
