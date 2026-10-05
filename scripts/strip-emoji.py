#!/usr/bin/env python3
"""Removes emoji from UI strings in the legacy admin page (idempotent). usage: strip-emoji.py FILE..."""
import re, sys
EMOJI = re.compile("[\U0001F300-\U0001FAFF☀-✒✗-➿⭐⭕️‍]\\s?")
for p in sys.argv[1:]:
    try: s = open(p, encoding="utf-8").read()
    except FileNotFoundError: continue
    t = EMOJI.sub("", s)
    t = t.replace('<option value="research">Research', '<option value="research">Research')
    if t != s:
        open(p, "w", encoding="utf-8").write(t); print("emoji removed:", p)
