#!/usr/bin/env python3
"""Idempotently wire OpportunityEditor + LinksManager into app/admin/page.tsx."""
import re, sys
p = sys.argv[1] if len(sys.argv) > 1 else "app/admin/page.tsx"
s = open(p, encoding="utf-8").read()
if "OpportunityEditor" in s:
    print("admin already patched"); sys.exit(0)

s = s.replace('import BlogManager from "@/components/admin/BlogManager";',
  'import BlogManager from "@/components/admin/BlogManager";\nimport OpportunityEditor from "@/components/admin/OpportunityEditor";\nimport LinksManager from "@/components/admin/LinksManager";\nimport GalleryManager from "@/components/admin/GalleryManager";', 1)

s = s.replace('  const [editingOppId, setEditingOppId] = useState<string | null>(null);',
  '  const [editingOppId, setEditingOppId] = useState<string | null>(null);\n  const [editingOpp, setEditingOpp] = useState<Opportunity | null>(null);\n  const [oppEditorKey, setOppEditorKey] = useState(0);', 1)

# openOppEditor: keep legacy state set, add new
s = re.sub(r'  const openOppEditor = \(opp\?: Opportunity\) => \{.*?\n  \};\n',
  '  const openOppEditor = (opp?: Opportunity) => {\n    setEditingOppId(opp?.id ?? null);\n    setEditingOpp(opp ?? null);\n    setOppEditorKey((k) => k + 1);\n    setOppEditorOpen(true);\n  };\n', s, count=1, flags=re.S)

# remove old save handler (replaced by editor)
s = re.sub(r'  const handleSaveOpportunity = async \(\) => \{.*?\n  \};\n', '', s, count=1, flags=re.S)

s = s.replace('{ id: "tabBlog", label: "✍️ Blog" },', '{ id: "tabLinks", label: "🔗 Links" },\n            { id: "tabGallery", label: "🖼️ Gallery" },\n            { id: "tabBlog", label: "✍️ Blog" },', 1)
s = s.replace('        {activeTab === "tabBlog" && (',
  '        {activeTab === "tabLinks" && (\n          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">\n            <LinksManager />\n          </motion.div>\n        )}\n\n        {activeTab === "tabGallery" && (\n          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">\n            <GalleryManager />\n          </motion.div>\n        )}\n\n        {activeTab === "tabBlog" && (', 1)

a = s.index("      {/* Opportunity Editor Modal */}")
b = s.index("      {/* Test Builder Modal */}")
new = '''      {/* Opportunity Editor */}
      <OpportunityEditor
        key={oppEditorKey}
        open={oppEditorOpen}
        initial={editingOpp as never}
        onClose={() => setOppEditorOpen(false)}
        onSaved={async (title, created) => {
          setOppEditorOpen(false);
          showToast(`✅ Opportunity "${title}" ${created ? "created" : "updated"}!`);
          await loadData();
        }}
      />

'''
s = s[:a] + new + s[b:]
open(p, "w", encoding="utf-8").write(s)
print("admin patched")
