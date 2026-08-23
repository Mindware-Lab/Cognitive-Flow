from pathlib import Path

path = Path("apps/cognitive-control-coach/src/main.ts")
text = path.read_text(encoding="utf-8")


def replace_once(label: str, old: str, new: str) -> None:
    global text
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: expected exactly one match, found {count}")
    text = text.replace(old, new, 1)


# Rendering must remain side-effect free. Bridge advancement happens after
# session progression, mission review and Bridge probes instead.
replace_once(
    "remove render-time Bridge advancement",
    '''function renderWelcome(): string {
  if (realLifePracticeState().currentMission?.status !== "pending") maybeAdvanceBridge();
  if (!suppressRealLifeCheckIn && realLifePracticeState().currentMission?.status === "pending") {''',
    '''function renderWelcome(): string {
  if (!suppressRealLifeCheckIn && realLifePracticeState().currentMission?.status === "pending") {''',
)

# B3 is personalisation: preserve the move the user selected. The cue's
# canonical/suggested move is retained only as comparison evidence.
replace_once(
    "preserve user's personalised move",
    '''    bridgePersonalMove = suggestedMove;
    recordBridgeEvidence("personal_cue_created", {
      move: suggestedMove,
      selectedMove,
      sourceWorkflow: journey.workflowChoice,
      notes: cue.label,
    });
    programme.bridgeProgression!.personalMove = suggestedMove;''',
    '''    bridgePersonalMove = selectedMove;
    recordBridgeEvidence("personal_cue_created", {
      move: suggestedMove,
      selectedMove,
      sourceWorkflow: journey.workflowChoice,
      notes: cue.label,
    });
    programme.bridgeProgression!.personalMove = selectedMove;''',
)

path.write_text(text, encoding="utf-8")
print("CCC Bridge corrective transform applied successfully")
