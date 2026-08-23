from pathlib import Path

# Triggered after the workflow file is present on the feature branch.
path = Path("apps/cognitive-control-coach/src/cccBridgeProgression.ts")
text = path.read_text(encoding="utf-8")

replacements = {
'''  find: {
    label: "Find",
    definition: "Identify what matters now.",
    question: "What matters?",
  },''': '''  find: {
    label: "Find",
    definition: "Select the task-relevant information; filter out competing noise.",
    question: "What information matters most right now?",
  },''',
'''  hold: {
    label: "Hold",
    definition: "Keep what matters available.",
    question: "What must stay available?",
  },''': '''  hold: {
    label: "Hold",
    definition: "Keep the selected information active in mind while you use it.",
    question: "What information must I keep active?",
  },''',
'''  update: {
    label: "Update",
    definition: "Change what needs changing; keep what still fits.",
    question: "What changed?",
  },''': '''  update: {
    label: "Update",
    definition: "Revise what you are holding when relevant information changes; keep what still applies.",
    question: "What changed, and what still matters?",
  },''',
'''  act: {
    label: "Act",
    definition: "When you have enough, take the next useful step.",
    question: "Enough to move?",
  },''': '''  act: {
    label: "Act",
    definition: "Use the current evidence to choose and carry out the next useful response.",
    question: "Do I have enough information to choose the next step?",
  },''',
}

for old, new in replacements.items():
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"Expected exactly one copy block match, found {count}: {old.splitlines()[0]}")
    text = text.replace(old, new, 1)

path.write_text(text, encoding="utf-8")
print("Updated CCC Bridge cognitive definitions and questions")
