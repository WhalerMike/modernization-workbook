-- "Topic: <hub>" under the title of every page that belongs to a topic (HTML only).
--
-- assets/topic-members.json maps each page (its repository path) to its topics. It is written by
-- scripts/build_topics.py from data/topics.yml. This filter sets fmw-topics, a list of
-- {title, href}, and assets/partials/title-block.html shows it.

local members = nil

local function load()
  if members ~= nil then return members end
  members = {}
  local root = quarto.project.directory or "."
  local f = io.open(pandoc.path.join({ root, "assets", "topic-members.json" }), "r")
  if f then
    local text = f:read("a")
    f:close()
    local ok, data = pcall(pandoc.json.decode, text, false)
    if ok and type(data) == "table" then members = data end
  end
  return members
end

function Meta(meta)
  if not quarto.doc.is_format("html") then return nil end
  local root = (quarto.project.directory or ""):gsub("\\", "/")
  local input = (quarto.doc.input_file or ""):gsub("\\", "/")
  if root ~= "" and input:sub(1, #root) == root then
    input = input:sub(#root + 2)
  end
  local topics = load()[input]
  if not topics or #topics == 0 then return nil end
  -- From the page's folder back to the site root.
  local _, depth = input:gsub("/", "")
  local up = string.rep("../", depth)
  local list = {}
  for _, t in ipairs(topics) do
    table.insert(list, pandoc.MetaMap({
      title = pandoc.MetaInlines({ pandoc.Str(t.title) }),
      href = pandoc.MetaString(up .. "docs/topics/" .. t.id .. ".html"),
    }))
  end
  meta["fmw-topics"] = pandoc.MetaList(list)
  if #list > 1 then meta["fmw-topics-many"] = true end
  return meta
end
