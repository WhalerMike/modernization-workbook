-- New Look only (newlook/_quarto-newlook.yml): portal-or-code tabs.
-- Wraps the code block that data/newlook/tabs.yml names (by text it contains)
-- in a tabset: the portal steps from that file first, then the code block,
-- unchanged. Runs before Quarto reads tabsets (`at: pre-ast`), so Quarto turns
-- the result into its usual tabs. The context comes from
-- scripts/newlook/build_context.py (_newlook/context/<page>.json).

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

local ctx = nil

-- Wrap the code block that contains `match` in a tabset: the portal steps
-- first, then the code, unchanged.
local function tabset(block, spec)
  local portal = pandoc.read(spec["portal"] or "", "markdown").blocks
  local content = pandoc.Blocks({})
  content:insert(pandoc.Header(6, spec["portal-label"] or "Portal"))
  content:extend(portal)
  content:insert(pandoc.Header(6, spec["code-label"] or "Code"))
  content:insert(block)
  return pandoc.Div(content, pandoc.Attr("", { "panel-tabset", "nl-tabs" }))
end

local function add_tabs(doc)
  local specs = ctx["tabs"] or {}
  if #specs == 0 then return doc end
  return doc:walk({
    CodeBlock = function(cb)
      for _, spec in ipairs(specs) do
        if spec["match"] and cb.text:find(spec["match"], 1, true) then
          return tabset(cb, spec)
        end
      end
    end,
  })
end

return {
  {
    Pandoc = function(doc)
      ctx = load_context()
      if ctx == nil then return nil end
      return add_tabs(doc)
    end,
  },
}
