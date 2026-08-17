from pathlib import Path

root = Path("apps/cognitive-control-coach")
real_life = root / "src/cccRealLifePractice.ts"
main = root / "src/main.ts"
tests = root / "tests/cccRealLifePractice.test.ts"

text = real_life.read_text(encoding="utf-8")
old = '''  sessionKind?: CccProgrammeSessionKind;\n  sessionNumber?: number;\n  blockIndex?: number;\n}'''
new = '''  sessionKind?: CccProgrammeSessionKind;\n  sessionNumber?: number;\n  blockIndex?: number;\n  sessionAnchorPhase?: string;\n}'''
if text.count(old) != 1:
    raise SystemExit("Could not add sessionAnchorPhase to context")
text = text.replace(old, new, 1)

old = '''  if (sessionKind === "p1b_wm_bridge") {\n    if (context.phase === "p1b_wm_arrow_stabilisation" || context.phase === "p1b_attention_bridge") return "task_state";\n    if (context.phase === "p1b_wm_flow_first_contact" || context.phase === "p1b_wm_flow_recovery") return "relations_across_change";\n    return "portable_structure";\n  }'''
new = '''  if (sessionKind === "p1b_wm_bridge") {\n    const progressionPhase = context.sessionAnchorPhase || context.phase;\n    if (progressionPhase === "p1b_wm_arrow_stabilisation" || progressionPhase === "p1b_attention_bridge") return "task_state";\n    if (progressionPhase === "p1b_wm_flow_first_contact" || progressionPhase === "p1b_wm_flow_recovery") return "relations_across_change";\n    return "portable_structure";\n  }'''
if text.count(old) != 1:
    raise SystemExit("Could not anchor P1b theme family")
text = text.replace(old, new, 1)
real_life.write_text(text, encoding="utf-8")

text = main.read_text(encoding="utf-8")
old = '''    sessionKind: journey?.plan.programmeSessionKind,\n    sessionNumber: journey?.plan.programmeSessionNumber,\n    blockIndex: block.index,\n  };'''
new = '''    sessionKind: journey?.plan.programmeSessionKind,\n    sessionNumber: journey?.plan.programmeSessionNumber,\n    blockIndex: block.index,\n    sessionAnchorPhase: journey?.plan.blocks.find((candidate) => candidate.phase !== "practice")?.phase,\n  };'''
if text.count(old) != 1:
    raise SystemExit("Could not add session anchor phase to main context")
text = text.replace(old, new, 1)
main.write_text(text, encoding="utf-8")

text = tests.read_text(encoding="utf-8")
anchor = '''  it("keeps one P1c theme while Find, Hold, Update and Act provide different block angles", () => {'''
addition = '''  it("keeps one theme through a P1b first-contact session even when later blocks are labelled recovery", () => {\n    const phases = [\n      ["p1b_wm_flow_first_contact", "wm_carrier_transfer", 1],\n      ["p1b_wm_flow_recovery", "baseline_stabilization", 2],\n      ["p1b_wm_flow_recovery", "baseline_stabilization", 3],\n      ["p1b_wm_flow_recovery", "baseline_stabilization", 4],\n    ] as const;\n    const presets = phases.map(([phase, transitionKind, blockIndex]) => resolveRealLifePracticePreset(context({\n      sessionKind: "p1b_wm_bridge",\n      sessionNumber: 9,\n      sessionAnchorPhase: "p1b_wm_flow_first_contact",\n      phase,\n      operator: "relational_wm",\n      transitionKind,\n      blockIndex,\n    })));\n\n    expect(new Set(presets.map((preset) => preset.themeFamilyId))).toEqual(new Set(["relations_across_change"]));\n    expect(new Set(presets.map((preset) => preset.themeId)).size).toBe(1);\n    expect(new Set(presets.map((preset) => preset.themeTitle)).size).toBe(1);\n    expect(new Set(presets.map((preset) => preset.angleTitle)).size).toBe(4);\n  });\n\n'''
if text.count(anchor) != 1:
    raise SystemExit("Could not insert P1b session-anchor test")
text = text.replace(anchor, addition + anchor, 1)

old = '''    expect(mainSource).toContain("Then I’ll");\n  });'''
new = '''    expect(mainSource).toContain("Then I’ll");\n    expect(mainSource).toContain("sessionAnchorPhase");\n  });'''
if text.count(old) != 1:
    raise SystemExit("Could not add session-anchor static check")
text = text.replace(old, new, 1)
tests.write_text(text, encoding="utf-8")

print("Anchored CCC strategic themes to the session starting progression state.")
