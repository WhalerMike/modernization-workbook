-- Research pages (docs/research/) carry `research-status` in their front matter:
--   draft, in review, proved, published.
-- Research is the staging area for production: an item is written (Draft),
-- reviewed (In review), validated in practice with recorded evidence (Proved),
-- and then published into production (Published). This filter labels each page
-- so a reader never mistakes research for production guidance:
--   * the eyebrow above the title reads "Research · <type> · <status>";
--   * a status callout opens the page.
-- Pages without `research-status` are left alone.

local stringify = pandoc.utils.stringify

local STATUS = {
  ["draft"] = "Draft",
  ["in review"] = "In review",
  ["proved"] = "Proved",
  ["published"] = "Published",
  ["promoted"] = "Published", -- earlier name for Published
}

local TYPE = {
  ["explainer"] = "Explainer",
  ["product deep dive"] = "Product deep dive",
  ["implementation guide"] = "Implementation guide",
}

local TEXT = {
  ["Draft"] = "This research is still being written. Expect gaps and changes; it is not part of the workbook's production guidance.",
  ["In review"] = "This is research under review, not part of the workbook's production guidance. Its claims are sourced, but its analysis and any recommendation are the program's working view; they may change before review is complete, and they are not endorsed by any federal agency.",
  ["Proved"] = "This research has been reviewed and validated in practice, with the evidence recorded on this page. It is waiting to be published into the workbook's production guidance. It is not endorsed by any federal agency.",
  ["Published"] = "This research has been reviewed, proved and published into the workbook's production guidance. This page is kept as the record of its sources, review and evidence.",
}

local status

function Meta(meta)
  if meta["research-status"] == nil then return nil end
  local raw = stringify(meta["research-status"]):lower()
  status = STATUS[raw] or stringify(meta["research-status"])
  local parts = { "Research" }
  if meta["research-type"] ~= nil then
    local t = stringify(meta["research-type"])
    table.insert(parts, TYPE[t:lower()] or t)
  end
  table.insert(parts, status)
  meta["fmw-eyebrow"] = pandoc.Inlines(table.concat(parts, " · "))
  return meta
end

function Pandoc(doc)
  if status == nil or not quarto.doc.is_format("html") then return nil end
  local text = TEXT[status] or TEXT["In review"]
  local callout = pandoc.Div(
    { pandoc.Header(2, "Research — " .. status), pandoc.Para(pandoc.Str(text)) },
    { class = (status == "Published" or status == "Proved") and "callout-note" or "callout-warning" }
  )
  table.insert(doc.blocks, 1, callout)
  return doc
end

return {
  { Meta = Meta },
  { Pandoc = Pandoc },
}
