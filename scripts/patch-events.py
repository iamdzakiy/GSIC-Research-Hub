#!/usr/bin/env python3
"""Make the PKM bootcamp page submit tests through the guarded server route (server-side scoring,
registration flags set in the same transaction). Idempotent; fails loudly if the page changed."""
import sys
p = sys.argv[1]
s = open(p, encoding="utf-8").read()
if "submitTest(" in s:
    print("events already patched"); sys.exit(0)
def rep(old, new):
    global s
    assert old in s, "pattern not found: " + old[:60]
    s = s.replace(old, new, 1)
rep('import { getTestResults, createTestResult } from "@/services/testResults";',
    'import { getTestResults } from "@/services/testResults";\nimport { submitTest } from "@/services/tests";')
rep("await createTestResult(newResult as any);\n    setTestResults([...testResults, newResult]);",
    "const saved = await submitTest(test.id, newResult.answers);\n    setTestResults([...testResults, { ...newResult, id: saved.id, score: saved.score, maxScore: saved.maxScore }]);")
rep("await updateRegistration(userRegistration.id, patch);", "// registration flags are set server-side in the same transaction")
rep("setTestResult({ score, maxScore });", "setTestResult({ score: saved.score, maxScore: saved.maxScore });")
rep("Score: ${score}/${maxScore}", "Score: ${saved.score}/${saved.maxScore}")
open(p, "w", encoding="utf-8").write(s)
print("events patched")
