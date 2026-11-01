-- Pages not yet proved carry `research-status` in their front matter, wherever
-- they live (guides and explainers under docs/books/, docs/training/,
-- docs/evaluations/, docs/reference/): draft, in review, proved, published.
-- An item is written (Draft), reviewed (In review), validated in practice with
-- recorded evidence (Proved), and then published into production (Published).
-- This filter labels each page so a reader never mistakes it for production
-- guidance before it is:
--   * the eyebrow above the title reads "<type> · <status>";
--   * a status callout opens the page.
-- An optional `last-reviewed: YYYY-MM-DD` adds "Last reviewed <date>." to the
-- callout, and says the review is overdue when the date is more than
-- REVIEW_DAYS before the render. The site re-renders on every push to main, and
-- the weekly source watch (scripts/source_watch/review_dates.py) lists overdue
-- pages between renders.
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
  ["training module"] = "Training module",
  ["external learning path"] = "External learning path",
  ["reference"] = "Reference",
  ["evaluation"] = "Evaluation",
}

local TEXT = {
  ["Draft"] = "This page is still being written. Expect gaps and changes; it is not part of the workbook's production guidance.",
  ["In review"] = "This page is under review and is not yet part of the workbook's production guidance. Its claims are sourced, but its analysis and any recommendation are the program's working view; they may change before review is complete, and they are not endorsed by any federal agency.",
  ["Proved"] = "This page has been reviewed and validated in practice, with the evidence recorded on this page. It is waiting to be published into the workbook's production guidance. It is not endorsed by any federal agency.",
  ["Published"] = "This page has been reviewed, proved and published into the workbook's production guidance. This page is kept as the record of its sources, review and evidence.",
}

local REVIEW_DAYS = 90

local status
local reviewed -- "YYYY-MM-DD", or nil

function Meta(meta)
  if meta["research-status"] == nil then return nil end
  local raw = stringify(meta["research-status"]):lower()
  status = STATUS[raw] or stringify(meta["research-status"])
  local parts = {}
  if meta["research-type"] ~= nil then
    local t = stringify(meta["research-type"])
    table.insert(parts, TYPE[t:lower()] or t)
  end
  table.insert(parts, status)
  if meta["last-reviewed"] ~= nil then
    reviewed = stringify(meta["last-reviewed"])
  end
  meta["fmw-eyebrow"] = pandoc.Inlines(table.concat(parts, " · "))
  return meta
end

function Pandoc(doc)
  if status == nil or not quarto.doc.is_format("html") then return nil end
  local text = TEXT[status] or TEXT["In review"]
  local y, m, d
  if reviewed ~= nil then
    y, m, d = reviewed:match("^(%d%d%d%d)%-(%d%d)%-(%d%d)")
  end
  if y ~= nil then
    text = text .. " Last reviewed " .. reviewed .. "."
    local age = os.difftime(os.time(), os.time({ year = tonumber(y), month = tonumber(m), day = tonumber(d), hour = 12 })) / 86400
    if age > REVIEW_DAYS then
      text = text .. " That is more than " .. REVIEW_DAYS .. " days ago, so this page is overdue for review: check its sources before relying on it."
    end
  end
  local callout = pandoc.Div(
    { pandoc.Header(2, "Status — " .. status), pandoc.Para(pandoc.Str(text)) },
    { class = (status == "Published" or status == "Proved") and "callout-note" or "callout-warning" }
  )
  table.insert(doc.blocks, 1, callout)
  return doc
end

return {
  { Meta = Meta },
  { Pandoc = Pandoc },
}
