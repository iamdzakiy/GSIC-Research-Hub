#!/usr/bin/env python3
"""Make the PKM bootcamp page submit tests through the guarded server route (server-side scoring,
registration flags set in the same transaction).

Idempotent and non-fatal: if the page is already patched (any alias) or has been edited so the
patterns no longer match, it prints what to do and exits 0 so apply.sh continues."""
import sys

p = sys.argv[1]
s = open(p, encoding="utf-8").read()

if "submitTestApi(" in s or ("createTestResult(" not in s and "services/tests" in s):
    print("events already patched"); sys.exit(0)

# NOTE: the page defines its own `const submitTest = async () => {}` handler, so the service function
# MUST be imported under a different name (otherwise the handler would call itself).
steps = [
    ('import { getTestResults, createTestResult } from "@/services/testResults";',
     'import { getTestResults } from "@/services/testResults";\nimport { submitTest as submitTestApi } from "@/services/tests";'),
    ("await createTestResult(newResult as any);\n    setTestResults([...testResults, newResult]);",
     "const saved = await submitTestApi(test.id, newResult.answers);\n    setTestResults([...testResults, { ...newResult, id: saved.id, score: saved.score, maxScore: saved.maxScore }]);"),
    ("await updateRegistration(userRegistration.id, patch);", "// registration flags are set server-side in the same transaction"),
    ("setTestResult({ score, maxScore });", "setTestResult({ score: saved.score, maxScore: saved.maxScore });"),
    ("Score: ${score}/${maxScore}", "Score: ${saved.score}/${saved.maxScore}"),
]
missing = [old[:70] for old, _ in steps if old not in s]
if missing:
    print("SKIPPED events patch: page differs from the expected original; nothing was changed.")
    for m in missing: print("   not found:", m)
    print("   (Optional) In the test-submit handler, replace createTestResult(...) with the service")
    print('   submitTest from "@/services/tests" imported under an alias, e.g.')
    print('   import { submitTest as submitTestApi } from "@/services/tests";')
    sys.exit(0)

for old, new in steps:
    s = s.replace(old, new, 1)
open(p, "w", encoding="utf-8").write(s)
print("events patched")
