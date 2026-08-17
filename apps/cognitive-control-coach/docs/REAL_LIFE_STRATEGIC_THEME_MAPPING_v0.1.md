# Cognitive Control Coach — Strategic Session Theme Mapping v0.1

**Status:** Design mapping only; no runtime/UI changes in this commit  
**App:** Cognitive Control Coach  
**Source framework:** SPACE–PACE–H-AGI / PACE Governor / niche–policy–cognition layer  
**Purpose:** Replace multiple block-level quasi-implementation-intentions with one coherent strategic theme per session. Each completed block gives a different concrete angle on the same theme. Only the session-end screen may create one cue–action implementation intention.

---

## 1. Core design rule

```text
ONE SESSION
→ ONE STRATEGIC THEME
→ EACH BLOCK = A DIFFERENT ANGLE ON THAT THEME
→ END OF SESSION = ONE CONCRETE IMPLEMENTATION INTENTION
→ ONE ACTIVE MISSION AT A TIME
```

Block reconnect screens are **interpretation only**. They explain what the just-completed training operation can look like in ordinary work, study, AI-assisted work or everyday planning. They must not ask the user to remember or adopt a new cue–action rule after every block.

The session-end reconnect screen is the only place where the user may choose **“I’ll try this once.”**

If a previous mission is still pending, a new mission must not silently replace it. The user must either:

- keep the existing mission; or
- explicitly replace it with the new session mission.

---

## 2. Framework principles used for the mapping

The source framework supplies the following high-level control logic.

### PACE mission spiral

```text
PURPOSE
What result matters and what must be protected?

ASSESS
What is happening, what evidence matters, and what follows?

COMMIT
What is the best-supported, proportionate next move?

EVOLVE
What happened, what should change, and what should be retained?
```

### PACE Governor

```text
STABILISE
Can I hold the goal and model coherently?

OPEN
Has the situation changed enough that I should reconsider the current model?

CONSTRAIN
Which information and possibilities actually matter now?

COMMIT
Would acting now teach more than thinking longer?

REVIEW
Continue, refine, switch, reopen, stabilise or bank?
```

### Transfer sequence

```text
stable operation
→ changed wrapper
→ recovery
→ return
→ mixed conditions
→ delayed re-entry
→ real-world cue/action
→ feedback
→ retain, revise or reopen
```

### Niche-coupling boundary

A real-life strategy is not assumed to work merely because it is cognitively sensible. The relevant setting must cue it, permit it, and provide interpretable feedback. If a strategy is difficult to use because of workload, interruption, lack of time, lack of authority or poor fit, the app treats this as information about the person–policy–niche system rather than as an individual failure.

---

## 3. Copy rule: concrete before abstract

Do not lead with technical or highly abstract phrases such as:

> Hold the relation.

> Preserve the invariant.

> Maintain the active model.

Those ideas may remain the internal logic, but public copy should lead with recognisable situations.

Preferred pattern:

```text
SHORT PRACTICAL HEADLINE
What this can look like in real life.

CONCRETE EXAMPLE
A specific work, study, AI or planning situation.

OPTIONAL SMALL FRAMEWORK TAG
Find / Hold / Update / Act
```

Example:

```text
Keep the important part in view

If you are interrupted while writing, keep the result you are aiming for
and one important limit visible — for example:
“finish the proposal” + “keep it under two pages”.

Small tag: HOLD
```

The framework label is secondary. The example carries the meaning.

---

## 4. Theme-selection architecture

The theme resolver should use:

```text
programme stage
+ current wrapper/WM progression point
+ current workflow
+ recent theme history
+ strategy direction where useful
```

The resolver should **not** select a wholly new behavioural strategy after every block.

For a stage that may repeat over several sessions, use a **theme family** containing several equivalent themes. Rotate them without repetition until the pool is exhausted.

Suggested persistence fields:

```text
sessionThemeId
sessionThemeFamilyId
sessionThemeVersion
recentThemeIds[]
```

The block reconnect uses the already-selected `sessionThemeId` and renders the angle appropriate to that block.

The session-end mission is reconstructed from the same selected theme plus the last actually completed block and the selected workflow.

---

# 5. Progression-to-theme mapping

## Theme family F0 — Clarify what matters

**CCC progression:** P0 signal anchor / earliest foundation work  
**Training transition:** establish a usable signal before more complex control  
**PACE emphasis:** Purpose + Stabilise + Constrain  
**Strategic meaning:** reduce the live problem to the information that should guide the next move.

### Session-theme variants

1. **Know what you are trying to finish.**
2. **Pick the fact that actually changes the choice.**
3. **Separate the main task from the surrounding noise.**
4. **Give one result priority for this work period.**
5. **Before speeding up, make sure you are looking at the right thing.**

### Concrete workflow examples

**Focused work**  
“You have email, Slack and three tabs open. Before switching again, name the one result you are trying to finish in this work block.”

**Demanding study**  
“You are reading several sources. Keep the essay question visible and ask which sentence or finding actually changes your answer.”

**AI-assisted work**  
“An AI response contains ten suggestions. Identify the one suggestion that affects the task you actually asked it to help with.”

**Everyday planning**  
“You have several errands and messages competing for attention. Pick the one outcome that matters before deciding what to do next.”

### Block-angle rule

Early blocks should explain **signal selection**, not prescribe a new habit. Later blocks in the same session can show how the same theme changes under time pressure or competing information.

---

## Theme family F1 — Keep the goal steady while the surface changes

**CCC progression:** P0 relative-arrow extension and P1a arrow stabilisation  
**Training transition:** establish a rule/reference frame before carrier perturbation  
**PACE emphasis:** Purpose + Stabilise  
**Strategic meaning:** keep one useful criterion stable long enough to learn what it predicts.

### Session-theme variants

1. **Keep one rule steady while you work.**
2. **Do not change the goal just because the presentation is busy.**
3. **Use a stable reference point before comparing alternatives.**
4. **Keep one non-negotiable requirement visible.**
5. **Let the task settle before redesigning the method.**

### Concrete workflow examples

**Focused work**  
“While drafting a report, keep one requirement fixed — for example, ‘the reader must understand the recommendation in under two minutes’.”

**Demanding study**  
“While moving between textbook, lecture notes and papers, keep the same question in view instead of letting each source redefine the task.”

**AI-assisted work**  
“Before asking for another rewrite, keep one requirement fixed — for example, ‘preserve the evidence limits’ or ‘keep the answer under 300 words’.”

**Everyday planning**  
“While comparing different ways to organise the day, keep the protected requirement fixed — for example, ‘leave by 3:30’.”

### Block-angle rule

- signal/attention block: identify the stable criterion;
- relative-reference block: show that the same situation can be judged relative to a goal or boundary rather than by surface salience.

---

## Theme family F2 — Notice what changed without throwing away what still works

**CCC progression:** P1a flow first contact  
**Training transition:** first controlled carrier perturbation  
**PACE emphasis:** Open  
**Strategic meaning:** a changed format is evidence to inspect, not a reason either to cling rigidly to the old routine or rebuild everything.

### Session-theme variants

1. **Ask what really changed.**
2. **New format does not always mean new problem.**
3. **Check whether the rule failed or only the presentation changed.**
4. **Reopen the method only as far as the evidence requires.**
5. **Treat surprise as a reason to inspect, not panic or persist blindly.**

### Concrete workflow examples

**Focused work**  
“A colleague sends the same project information as a spreadsheet instead of an email. Check what changed in the facts before changing the decision.”

**Demanding study**  
“A diagram presents the same mechanism differently from the textbook. Ask whether the underlying relationship changed or only the representation.”

**AI-assisted work**  
“A new model gives a very different-looking answer. Compare the claims and evidence before assuming the underlying recommendation has changed.”

**Everyday planning**  
“A plan is disrupted by a train cancellation. Identify which part is actually broken — the route, the timing, or the whole goal.”

### Block-angle rule

The first-contact block should emphasise **difference detection and selective reopening**. Do not yet turn this into a fixed action plan.

---

## Theme family F3 — Adapt the method without losing the target

**CCC progression:** P1a flow recovery  
**Training transition:** recovery in the new carrier  
**PACE emphasis:** Assess + Open → Constrain  
**Strategic meaning:** learn the new surface while preserving the result, boundary or relation that remains useful.

### Session-theme variants

1. **Change the method, not the goal.**
2. **Use the new information without starting from zero.**
3. **Keep what survived the change and revise what did not.**
4. **Update the route while protecting the destination.**
5. **Make a local adjustment before a whole-plan rewrite.**

### Concrete workflow examples

**Focused work**  
“A meeting changes who owns a task. Update the hand-off and timing without reopening every settled decision in the project.”

**Demanding study**  
“A new paper challenges one mechanism in your explanation. Revise that part while keeping the parts still supported by the evidence.”

**AI-assisted work**  
“The AI output misses one requirement. Fix the missing requirement instead of regenerating the entire piece unless the core structure is actually wrong.”

**Everyday planning**  
“One appointment moves. Rework the affected part of the day rather than rebuilding the whole schedule.”

### Block-angle rule

Repeated recovery sessions rotate examples of **local revision**, **boundary preservation**, **evidence-sensitive updating** and **avoiding whole-system overreaction**.

---

## Theme family F4 — Return without starting over

**CCC progression:** P1a arrow return  
**Training transition:** recover the earlier wrapper after learning the new one  
**PACE emphasis:** Review + Learning/Transfer  
**Strategic meaning:** re-enter a familiar task using what was learned elsewhere rather than resetting to the old routine unchanged.

### Session-theme variants

1. **Come back with what you learned.**
2. **Do not confuse returning with resetting.**
3. **Recover the old task, then improve it with the new evidence.**
4. **Use the familiar route without slipping back into the old mistake.**
5. **Bring the useful update back to the original context.**

### Concrete workflow examples

**Focused work**  
“After a meeting, return to your draft by checking the last completed section and the one decision the meeting changed.”

**Demanding study**  
“After solving a problem in a different format, return to the original question and use the new method rather than repeating the old steps automatically.”

**AI-assisted work**  
“After using AI to explore alternatives, return to your own draft and apply only the changes that survived your checks.”

**Everyday planning**  
“After handling an interruption, return to the original task from the last completed step rather than restarting the whole plan.”

### Block-angle rule

Show **re-entry with retained learning**. Avoid any implication that the user must keep multiple cue-action rules in memory.

---

## Theme family F5 — Switch formats without switching goals

**CCC progression:** P1a relative mix  
**Training transition:** unpredictable carrier alternation  
**PACE emphasis:** Governor mode switching + Constrain  
**Strategic meaning:** let the format determine how you inspect information, but let purpose determine what counts as relevant.

### Session-theme variants

1. **Different format, same decision standard.**
2. **Switch tools without losing the task.**
3. **Change how you look, not what you are trying to resolve.**
4. **Use one criterion across several information sources.**
5. **Do not let the latest format become the new goal.**

### Concrete workflow examples

**Focused work**  
“Move between a document, spreadsheet and meeting notes while checking each against the same decision you need to make.”

**Demanding study**  
“Move between equations, prose and diagrams while asking the same underlying question.”

**AI-assisted work**  
“Compare a chat answer, generated table and source document against the same requirement instead of evaluating each on its own terms.”

**Everyday planning**  
“Use your calendar, messages and notes as different views of the same day rather than three separate plans.”

### Block-angle rule

Each mixed block can use a different example of **tool switching**, **source switching**, **format switching** or **context switching** while preserving one decision criterion.

---

## Theme family F6 — Restart from the last useful point

**CCC progression:** P1a delayed recheck and later delayed re-entry  
**Training transition:** recovery after time without immediate priming  
**PACE emphasis:** Learning/Transfer + Review  
**Strategic meaning:** reconstruct the useful state after a gap instead of either starting from zero or blindly continuing an obsolete plan.

### Session-theme variants

1. **Restart from the last useful point.**
2. **Reconstruct before you resume.**
3. **Remember the goal, then check what is true now.**
4. **Use yesterday’s structure, not yesterday’s assumptions.**
5. **Come back with a quick state check before acting.**

### Concrete workflow examples

**Focused work**  
“When you return to a project tomorrow, name the last completed step, the next intended step and anything that changed overnight.”

**Demanding study**  
“Before reopening your notes, state the question you were answering and what you had already concluded; then check the next source against that.”

**AI-assisted work**  
“When you reopen an AI-assisted task later, restate your goal and the last accepted decision before generating more material.”

**Everyday planning**  
“After a long interruption, identify what is already done and what still matters now before continuing the old plan.”

### Block-angle rule

Delayed sessions can rotate **memory reconstruction**, **state checking**, **assumption refresh**, **next-step recovery** and **changed-condition checks**.

---

## Theme family F7 — Keep the task state intact while information changes

**CCC progression:** P1b WM arrow stabilisation / WM introduction  
**Training transition:** relational working-memory demand added  
**PACE emphasis:** Stabilise + Purpose + Comprehension  
**Strategic meaning:** preserve the small amount of structure needed to keep a multi-step task coherent.

### Session-theme variants

1. **Keep the goal and one limit visible.**
2. **Hold the task state, not every detail.**
3. **Remember what matters for the next decision.**
4. **Keep the question, constraint and next step together.**
5. **Do not make memory carry what the workspace can display.**

### Concrete workflow examples

**Focused work**  
“Keep three short lines visible while working: RESULT · LIMIT · NEXT. Example: ‘send proposal · under £5k · confirm supplier price’.”

**Demanding study**  
“Keep the current claim, the evidence limit and the next question visible while moving through several sources.”

**AI-assisted work**  
“Keep the goal and one must-not-lose requirement on screen while the AI generates alternatives.”

**Everyday planning**  
“Keep ‘where I am now · what must happen next · what time I must leave’ visible while plans change.”

### Block-angle rule

Successive WM blocks can explain different aspects of task state: **goal**, **constraint**, **source/context**, **sequence**, **next step**. They do not each create a new implementation intention.

---

## Theme family F8 — Update the details without losing what belongs together

**CCC progression:** P1b WM flow first contact / flow recovery  
**Training transition:** relational memory carried into a changed carrier  
**PACE emphasis:** Open + Assess + Binding/context discipline  
**Strategic meaning:** preserve the relationship among goal, source, condition and consequence while surface details change.

### Session-theme variants

1. **Keep the connection, update the details.**
2. **Do not detach a claim from where it came from.**
3. **Change the current value without losing its role.**
4. **When the format changes, keep source and condition attached.**
5. **Update one part of the task state at a time.**

### Concrete workflow examples

**Focused work**  
“If a project number changes, update the number but keep it attached to the right client, deadline and decision.”

**Demanding study**  
“Keep a finding attached to the study population and method instead of remembering only the headline result.”

**AI-assisted work**  
“Keep an AI-generated claim attached to its source and uncertainty rather than carrying the claim forward on its own.”

**Everyday planning**  
“When a booking time changes, update the time while keeping the correct person, place and travel requirement together.”

### Block-angle rule

Rotate examples of **source binding**, **context binding**, **role binding**, **sequence binding** and **condition binding**.

---

## Theme family F9 — Bring the useful structure back across contexts

**CCC progression:** P1b WM arrow return / WM mixed  
**Training transition:** return and mixed-carrier relational memory  
**PACE emphasis:** Review + Learning/Transfer  
**Strategic meaning:** recover the same task structure in multiple representations without confusing surface similarity with true equivalence.

### Session-theme variants

1. **Bring the same structure back in a different form.**
2. **Check the relationship, not just the resemblance.**
3. **Use what transferred; drop what belonged only to the old format.**
4. **Keep the rule portable by knowing its boundary.**
5. **Do not mistake a familiar-looking example for the same problem.**

### Concrete workflow examples

**Focused work**  
“A risk described in a meeting and the same risk shown in a dashboard should be treated as one issue only if the underlying condition is actually the same.”

**Demanding study**  
“Two examples can look different but instantiate the same rule; two similar examples can require different rules. Check the relation.”

**AI-assisted work**  
“Two AI answers may use different wording but make the same claim; two similar-looking answers may rely on different assumptions. Compare the structure.”

**Everyday planning**  
“A delay caused by travel time is not the same problem as a delay caused by someone else’s availability, even if both push the schedule back.”

### Block-angle rule

Use mixed blocks to teach **same underneath / different underneath**, **boundary conditions**, and **portable reconstruction**.

---

## Theme family F10 — Use the right thinking operation at the right time

**CCC progression:** P1c operator integration  
**Training transition:** attention → WM hold → attention re-entry → operator mix  
**PACE emphasis:** PACE Governor + Commit  
**Strategic meaning:** distinguish between checking what is present now, holding prior structure, updating it, and acting.

### Session-theme variants

1. **Check what is here now before relying on memory.**
2. **Hold the plan when it still fits; update it when the evidence changes.**
3. **Do not keep analysing when the next step is already clear.**
4. **Switch between checking, holding and acting deliberately.**
5. **Use memory to guide attention, not replace current evidence.**
6. **Use the smallest useful action when it can teach more than another round of checking.**

### Concrete workflow examples

**Focused work**  
“You remember the project plan, but a new message has arrived. Check the message, update the relevant part of the plan, then continue rather than rereading everything.”

**Demanding study**  
“Hold your current explanation while reading the next result, but change it if the new evidence genuinely contradicts it.”

**AI-assisted work**  
“Keep your goal in mind, inspect the new AI output, and if it satisfies the requirement, move on rather than prompting for more versions.”

**Everyday planning**  
“Remember the plan, check the current time and conditions, then decide whether to continue, adjust or stop.”

### Block-angle mapping within one P1c session

1. **Attention entry — Check what is true now.**  
   Concrete angle: current evidence can invalidate an old task state.

2. **WM hold — Keep the useful structure available.**  
   Concrete angle: retain goal/constraint/sequence while new material arrives.

3. **Attention re-entry — Refresh the plan from present evidence.**  
   Concrete angle: do not let remembered context override what has changed.

4. **Operator mix — Choose whether to check, hold, update or act.**  
   Concrete angle: the strategic skill is switching operations appropriately, not maximising one operation.

This is the clearest stage for making the PACE Governor visible in ordinary language.

---

## Theme family F11 — Learn from the result and keep only what travels

**CCC progression:** P1c delayed integration / programme completion  
**Training transition:** delayed integrated recovery and final transfer evidence  
**PACE emphasis:** Evolve + Review + Bank + niche coupling  
**Strategic meaning:** judge the method by what happened in the real setting, separate personal/cognitive difficulty from environmental friction, and retain only what remains useful.

### Session-theme variants

1. **Judge the strategy by what happened, not how sensible it sounded.**
2. **Keep what worked across situations; revise what did not.**
3. **Ask whether the problem was the strategy or the setting.**
4. **Use feedback to make a local correction before rewriting the whole method.**
5. **Bank the rule only when it survives change and delay.**
6. **If the environment blocks the strategy, change the cue, support or workflow — not just the person.**

### Concrete workflow examples

**Focused work**  
“If ‘keep one result visible’ failed because meetings kept interrupting the work block, the next change may be a protected 20-minute window rather than more effort at concentration.”

**Demanding study**  
“If a source-checking strategy helped in essays but not timed problems, keep the principle but change how it is cued under time pressure.”

**AI-assisted work**  
“If checking every AI claim is too slow, identify which claims are consequential enough to verify rather than abandoning verification or checking everything.”

**Everyday planning**  
“If the plan failed because someone else controlled the timing, change the coordination or buffer rather than treating the failure as poor self-control.”

### Block-angle rule

Use delayed integration to connect **recovery**, **feedback interpretation**, **local vs structural update**, **strategy fit**, and **bank/revise/reopen**.

---

# 6. Session-level selection by actual CCC progression

| CCC state / phase | Primary theme family | Secondary families permitted | Avoid |
| --- | --- | --- | --- |
| `signal_anchor` | F0 Clarify what matters | F1 | complex transfer language |
| `arrow_rel_stabilisation`, `p1a_arrow_stabilisation` | F1 Keep goal steady | F0 | implementation-intention overload |
| `p1a_flow_first_contact` | F2 Ask what changed | F3 | “everything has changed” framing |
| `p1a_flow_recovery` | F3 Adapt without losing target | F2 | whole-plan redesign examples |
| `p1a_arrow_return` | F4 Return without starting over | F3 | simple repetition framing |
| `p1a_relative_mix` | F5 Switch formats, keep goal | F4 | unrelated productivity tips |
| `p1a_delayed_recheck` | F6 Restart from last useful point | F4, F11 | implying delayed success proves far transfer |
| `p1b_wm_arrow_stabilisation` | F7 Keep task state intact | F1 | abstract “hold relation” copy |
| `p1b_wm_flow_first_contact`, `p1b_wm_flow_recovery` | F8 Update details, keep bindings | F3, F7 | separate intention after each WM block |
| `p1b_wm_arrow_return`, `p1b_wm_relative_mix` | F9 Bring structure across contexts | F5, F8 | surface-similarity claims |
| `p1c_attention_entry` | F10 Right operation at right time | F6 | assuming memory is current evidence |
| `p1c_wm_hold` | F10 Right operation at right time | F7 | new standalone Hold mission |
| `p1c_attention_reentry` | F10 Right operation at right time | F3, F6 | blind continuation |
| `p1c_operator_mix` | F10 Right operation at right time | F5 | abstract mode labels without examples |
| `p1c_delayed_reentry` / final delayed integration | F11 Learn from result | F6, F10 | “you transferred the skill” claims |

---

# 7. Repeated-session flexibility

Some users will remain in a learning-curve stage for several sessions. The copy system must therefore support repetition without either:

- repeating the same headline/example every session; or
- escalating to a more advanced strategic concept before the training stage has advanced.

Recommended rule:

```text
same CCC stage
→ same theme family
→ rotate theme variant
→ rotate workflow example angle
→ keep conceptual difficulty stable
```

Example for repeated `p1a_flow_recovery` sessions:

```text
Session A
Change the method, not the goal.
Example: update one project hand-off without reopening the whole project.

Session B
Keep what survived the change and revise what did not.
Example: revise one part of an explanation after a new paper.

Session C
Make a local adjustment before a whole-plan rewrite.
Example: fix one missed AI requirement instead of regenerating everything.

Session D
Update the route while protecting the destination.
Example: move one appointment without rebuilding the whole day.
```

All four teach the same progression-level principle.

Suggested selection constraints:

- do not repeat the same `sessionThemeId` within the previous 3 sessions where alternatives exist;
- favour a workflow-specific example the user has not seen recently;
- do not advance to the next family until CCC progression advances;
- strategy-direction feedback (`slow_down` / `speed_up`) may tune the example inside the current family but must not replace the family;
- a theme may recur later in a more advanced form when the app revisits the same control problem at a higher layer.

---

# 8. Strategy-direction adaptation inside a theme

Current CCC strategy feedback can still personalise the interpretation layer, but it should modify the **angle**, not replace the session theme.

Example: F10 “Use the right thinking operation at the right time.”

If `slow_down`:

> “Before acting on an AI summary that will affect a real decision, check the one claim most capable of changing the choice.”

If `speed_up`:

> “If the requirement is satisfied and the next step is reversible, use the output and move on rather than asking for another version.”

Same theme. Different control correction.

---

# 9. Session-end implementation intention contract

Only one cue–action mission is created at session completion.

It should be generated from:

```text
selected session theme
+ workflow
+ last actually completed block
+ strategy direction where relevant
```

Examples:

### F3 — Adapt without losing the target

**AI-assisted work**

```text
IF a new AI output changes the format or wording,
THEN I will check which requirement actually changed before regenerating the whole task.
```

### F7 — Keep the task state intact

**Focused work**

```text
IF I am interrupted while working,
THEN I will reread my RESULT · LIMIT · NEXT lines before continuing.
```

### F10 — Right operation at the right time

**Everyday planning**

```text
IF I return to a plan after something has changed,
THEN I will check what is true now before deciding whether to continue or adjust.
```

### F11 — Learn from the result

**Demanding study**

```text
IF a strategy does not work in the next study task,
THEN I will note whether the problem was the strategy, the time available, or the task format before changing the whole method.
```

---

# 10. One-active-mission rule

The current state model has one `currentMission`. Preserve that simplicity deliberately.

At session end:

```text
NO PENDING MISSION
→ offer today’s mission

PENDING MISSION EXISTS
→ show existing mission first
→ choices:
   KEEP CURRENT MISSION
   REPLACE WITH TODAY’S MISSION
   MAYBE LATER
```

Never silently overwrite a pending or deferred mission.

“Not yet” continues to mean:

```text
defer the existing mission
≠ close it
≠ create another mission automatically
```

---

# 11. Screen and layout contract for implementation

The next implementation step should **reuse the existing screens and layout containers**.

No new screen is required.

### Existing block reconnect screen

Replace:

```text
Real-life practice lens
When ...
Try ...
```

with:

```text
TODAY’S THEME
Concrete headline
1–2 sentence concrete explanation/example
small optional framework tag
```

No “I’ll try this” control at block level.

### Existing session-completion reconnect screen

Retain the current position and action area, but use:

```text
TODAY’S THEME
short recap across the session
ONE cue–action plan
I’ll try this once / Maybe later
```

If an old mission is pending, render the keep/replace choice in this existing completion surface rather than adding a new navigation step.

### Existing next-visit check-in

Retain:

- Yes—it helped
- I tried it, but it did not help
- The situation made it difficult
- Not yet

Retain the barrier follow-up because it operationalises the niche–policy–cognition distinction.

### Responsive boundary

Preserve the current no-overflow contract:

- no new scrolling container;
- no additional full-screen route;
- examples should be short enough to fit the existing reconnect card;
- on short-height screens, remove secondary explanation before shrinking controls.

---

# 12. Measurement and claims boundary

The strategic theme layer remains interpretation/practice support.

It must remain:

```text
scoreAffecting: false
```

It must not alter:

- cognitive scores;
- baseline-100 scores;
- standardised scores;
- learning-curve gates;
- n-back progression;
- transfer gates;
- badges;
- programme completion.

User-facing copy should not say that a theme, mission or successful self-report demonstrates far transfer. It provides a structured real-world probe and niche-coupling record.

---

# 13. Implementation sequence after mapping approval

```text
1. Introduce versioned session-theme types and theme library.
2. Resolve one theme when a session/journey is created.
3. Persist the selected theme with the journey.
4. Replace per-block preset selection with block-angle rendering from the session theme.
5. Remove block-level cue–action / quasi-implementation-intention wording.
6. Generate one session-end mission from the selected theme.
7. Enforce one-active-mission keep/replace semantics.
8. Migrate old saved missions/presets safely.
9. Update tests for repeated-stage rotation and one-active-mission behaviour.
10. Re-run full CCC + commerce/access regression suite.
11. Verify desktop/tablet/mobile no-overflow behaviour.
```

No Stripe, checkout, authentication or entitlement code should be touched by this implementation.
