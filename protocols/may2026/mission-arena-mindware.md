## 1. Common mindware across Towers and Black Box

Both games can train a shared **Mission Arena core script**:

| Common mindware                | What it trains                                         | Prompt handle                                 |
| ------------------------------ | ------------------------------------------------------ | --------------------------------------------- |
| **Variable map**               | Identify the relevant state variables before reasoning | “What are the key variables here?”            |
| **Constraint check**           | Preserve rules while searching                         | “What must remain true?”                      |
| **Possibility-space tracking** | Hold multiple candidate worlds in mind                 | “What possibilities are still open?”          |
| **Elimination**                | Remove impossible states without overcommitting        | “What can no longer be true?”                 |
| **Next best move / probe**     | Choose the move that gives the most useful information | “Which action reduces uncertainty most?”      |
| **Counterexample test**        | Check whether a candidate solution breaks a rule       | “What would prove this wrong?”                |
| **Update loop**                | Revise the internal model after feedback               | “What did this result rule in or out?”        |
| **Transfer abstraction**       | Extract the general pattern beyond the puzzle surface  | “Where else does this same structure appear?” |

This is directly aligned with the mission-template evidence review: the defensible training architecture is not “puzzles improve IQ”, but compact reasoning templates, varied wrappers, real-world missions, feedback and delayed re-checks. 

## 2. Towers-specific mindware

Towers is mainly a **visible constraint-satisfaction and ordinal reasoning game**. The whole problem space is present, but the user must infer values while preserving row, column and visibility constraints.

| Towers mindware                 | Cognitive function                                           | Prompt handle                                         |
| ------------------------------- | ------------------------------------------------------------ | ----------------------------------------------------- |
| **Permutation constraint**      | Each row/column must contain every value once                | “What values must this row/column still contain?”     |
| **Visibility inversion**        | Translate edge clues into ordered height constraints         | “What sequence would make this clue true?”            |
| **Ordinal chain reasoning**     | Reason with taller/shorter relations                         | “Which tower must be before or after another?”        |
| **Forced placement**            | Detect cells with only one viable value                      | “Which square is now forced?”                         |
| **Line constraint scan**        | Use row/column-level structure rather than isolated guessing | “Which line is most constrained?”                     |
| **Contradiction look-ahead**    | Test a candidate by simulating consequences                  | “If I place this here, what breaks?”                  |
| **Pencil-mark discipline**      | Maintain a clean possibility set                             | “What can I safely remove?”                           |
| **Local-to-global consistency** | Integrate one clue with the whole grid                       | “Does this move preserve every row, column and clue?” |

### Towers as a mindware mission

**Core cue:**
“What constraints must remain true after each move?”

**In-game micro-prompts:**

```text
What must be true in this row?
What must be true in this column?
Which clue creates the strongest constraint?
What value is impossible here?
If this value goes here, what becomes forced next?
```

**Post-mission reflection:**

```text
Which clue reduced the most uncertainty?
Did you solve by guessing, or by preserving constraints?
Where did one local deduction change the whole grid?
```

**Real-world transfer wrapper:**

```text
Where today do you need to allocate limited options while keeping several constraints true?
```

Good semantic wrappers for Towers:

| Puzzle surface         | Real-world wrapper                             |
| ---------------------- | ---------------------------------------------- |
| Towers in rows/columns | Scheduling tasks into fixed slots              |
| Heights                | Priority levels, resource sizes, risk levels   |
| Edge clues             | External requirements, stakeholder constraints |
| Row/column uniqueness  | “Each category must be represented once”       |
| Pencil marks           | Options still available                        |

So Towers maps well onto **planning, scheduling, resource allocation, priority balancing, curriculum design, staffing, and strategic sequencing**.

## 3. Black Box-specific mindware

Black Box is different. It is not primarily about visible constraints. It is about **latent-cause inference from indirect probes**. The hidden balls are not visible, and the learner must infer them from laser paths, hits, reflections and exits. The rules include absorption, left/right deflection, reflection, and the possibility that more than one hidden layout can produce equivalent observable outputs. 

| Black Box mindware                   | Cognitive function                                                | Prompt handle                                                        |
| ------------------------------------ | ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Hidden-cause modelling**           | Infer unseen structure from observable effects                    | “What hidden layout could explain this?”                             |
| **Probe selection**                  | Choose tests that reduce uncertainty                              | “Which beam would teach me the most?”                                |
| **Causal path simulation**           | Mentally trace beam consequences                                  | “Where would this path go if a ball were here?”                      |
| **Rival models**                     | Compare multiple possible hidden layouts                          | “What else could explain the same result?”                           |
| **Discriminating test**              | Find a probe that separates candidate models                      | “What test would distinguish these possibilities?”                   |
| **Evidence updating**                | Revise beliefs after each beam result                             | “What did this beam rule out?”                                       |
| **Equivalence-class reasoning**      | Accept different hidden layouts if they produce identical outputs | “Is this exact layout required, or just observationally equivalent?” |
| **Stop rule / confidence threshold** | Decide when the model is good enough to submit                    | “Do I have enough evidence to commit?”                               |

### Black Box as a mindware mission

**Core cue:**
“What test gives the most information about the hidden structure?”

This is already the natural Mission Arena cue in your development path, where Towers is framed around constraint preservation and Black Box around information-gaining tests. 

**In-game micro-prompts:**

```text
What hidden arrangement could cause this result?
Which cells are now less likely?
What beam would separate two rival layouts?
What result would change your mind?
Are you proving a location, or only narrowing the model?
```

**Post-mission reflection:**

```text
Which probe changed your model most?
Did you test the most uncertain area or just the most obvious one?
Did two different layouts explain the same evidence?
```

**Real-world transfer wrapper:**

```text
What is one opaque system in your life or work that you could test indirectly?
```

Good semantic wrappers for Black Box:

| Puzzle surface      | Real-world wrapper                                |
| ------------------- | ------------------------------------------------- |
| Hidden balls        | Hidden causes, bugs, market drivers, user motives |
| Laser beams         | Tests, questions, experiments, probes             |
| Hit                 | Direct contradiction / blocked path               |
| Reflection          | Unexpected system response                        |
| Exit point          | Observable outcome                                |
| Non-unique solution | Equifinality: different causes, same evidence     |

So Black Box maps well onto **debugging, scientific reasoning, market testing, diagnosis-like reasoning, user research, negotiation probing, organisational problem analysis and strategic uncertainty reduction**.

## 4. Common vs unique mindware: clean assignment

### Shared Mission Arena core

These should appear in both games:

```text
1. Map the variables.
2. List what must be true.
3. List what cannot be true.
4. Track remaining possibilities.
5. Choose the next move that reduces uncertainty.
6. Update the model after feedback.
7. Test whether the strategy transfers to another wrapper.
```

### Towers emphasis

```text
Constraint preservation
Ordinal / transitive reasoning
Permutation logic
Visibility-to-order translation
Forced placements
Contradiction testing
Static problem-space search
```

### Black Box emphasis

```text
Hidden-cause inference
Probe design
Value-of-information reasoning
Causal path simulation
Rival models
Discriminating tests
Equivalence-class reasoning
Uncertainty-based stopping
```

## 5. How this maps to the SR Inference Space

The WM/SR protocol is especially relevant because it trains relation families such as sameness/difference, order, exclusion, path constraints, probabilistic relations and successor-state prediction. The protocol describes this as increasing the dimensionality and usability of the relational state space, with prompts helping the global workspace sample and stabilise candidate inferences. 

| SR / relational family  | Towers                                            | Black Box                                                           |
| ----------------------- | ------------------------------------------------- | ------------------------------------------------------------------- |
| **State binding**       | Cell ↔ value ↔ row/column                         | Cell ↔ possible ball/no ball                                        |
| **Ordinal chains**      | Taller/shorter order from visibility clues        | Less central, but can apply to beam path order                      |
| **Exclusion**           | If 4 is here, 4 cannot be elsewhere in row/column | If this beam exits here, certain ball positions are impossible      |
| **Conjunction**         | Row + column + clue jointly force a value         | Ball relation + beam entry jointly causes hit/deflection/reflection |
| **Path constraints**    | A line must remain compatible with all clues      | A beam path must remain compatible with hidden structure            |
| **Counterfactuals**     | “If this were 5, what would break?”               | “If a ball were here, where would the beam go?”                     |
| **Successor horizon**   | “What becomes forced after this placement?”       | “What probe becomes useful after this result?”                      |
| **Equivalence classes** | Usually one exact solution                        | Multiple hidden layouts may be acceptable if observations match     |

## 6. Recommended prompt/global-workspace mechanics

Use the same four-part mission wrapper for both games:

### A. Mission briefing

Explain the cognitive mission, not just the rules.

**Towers:**

```text
Your mission is to preserve several constraints at once. 
Every move must keep the row, column and visibility clues possible.
```

**Black Box:**

```text
Your mission is to infer a hidden structure from indirect evidence.
Each beam is a test. Choose probes that change your model.
```

### B. Pre-attempt meta-cue

Keep this to one sentence.

**Towers:**
“What constraints must remain true after this move?”

**Black Box:**
“What probe would give the most useful information?”

### C. In-game optional hint prompts

Do not over-prompt. Use optional “Think” buttons or post-error prompts.

**Towers hint set:**

```text
Check the most constrained row or column.
Look for a clue that forces an order.
Remove values that would break row/column uniqueness.
Test one candidate by asking what it would force next.
```

**Black Box hint set:**

```text
Compare two possible hidden layouts.
Choose a beam that would separate them.
Trace the beam path before firing.
Ask what result would change your mind.
```

### D. Post-mission reflection

Use one shared reflection plus one game-specific reflection.

**Shared:**

```text
What did you learn about the problem space?
```

**Towers-specific:**

```text
Which constraint did the most work?
```

**Black-Box-specific:**

```text
Which probe changed your model most?
```

### E. Transfer prompt

Turn the solved puzzle into a real-world implementation intention.

**Towers:**

```text
When I face a planning problem with several fixed constraints, I will first list what must remain true before choosing a move.
```

**Black Box:**

```text
When I face an opaque problem, I will choose one small probe that can distinguish between two rival explanations.
```

## 7. Suggested v1 mindware set for Mission Arena

For the first MVP, I would not include too many mindware scripts. Start with **six common scripts** and **three unique scripts per game**.

### Common scripts

```text
1. Variable Map
2. Must / Cannot Check
3. Possibility Set
4. Next Best Move
5. Counterexample Test
6. Update and Transfer
```

### Towers scripts

```text
1. Preserve the Constraints
2. Read the Edge Clue
3. Find the Forced Square
```

### Black Box scripts

```text
1. Build the Hidden Model
2. Choose the Best Probe
3. Separate Rival Explanations
```

That gives you a compact enough system for the MVP while still making the vertical transfer principle visible. The app can later expand into more specialised scripts such as “equivalence class”, “premortem”, “base-rate update”, “bottleneck map”, and “implementation intention”.

## 8. Strong product interpretation

The two games together form a good starter bridge because they cover two deep adaptive-intelligence modes:

```text
Towers:
How do I act when the structure is visible but tightly constrained?

Black Box:
How do I act when the structure is hidden and must be inferred through tests?
```

 
##  Bridges as the third foundational mindware lane

Bridges trains a different kind of fluid-intelligence problem space from Towers and Black Box.

Towers asks:

> “What value can go here without breaking visible constraints?”

Black Box asks:

> “What hidden model best explains these indirect observations?”

Bridges asks:

> “How do I connect all parts of the system while satisfying each node’s local demand and avoiding invalid connections?”

That makes Bridges ideal for **systems thinking, dependency mapping, stakeholder coordination, infrastructure design, team workflows, business pipelines, collaboration networks and project architecture**.

## 1. Common mindware shared by Towers, Black Box and Bridges

Bridges still shares the general Mission Arena core:

| Common mindware          | Towers                                  | Black Box                                     | Bridges                                    |
| ------------------------ | --------------------------------------- | --------------------------------------------- | ------------------------------------------ |
| **Variable map**         | Cell, row, column, height, clue         | Cell, ball/no ball, beam path                 | Island, bridge, direction, degree          |
| **Constraint check**     | Row/column uniqueness, visibility clues | Beam rules, hit/reflection/exit evidence      | Island numbers, no crossings, connectivity |
| **Possibility tracking** | Candidate values per square             | Candidate ball layouts                        | Possible bridge links                      |
| **Elimination**          | Remove impossible values                | Rule out hidden positions                     | Mark non-bridges                           |
| **Next best move**       | Choose most constrained row/clue        | Choose most informative beam                  | Choose most constrained island/link        |
| **Counterexample test**  | “Would this break a row or clue?”       | “Would this model produce the observed path?” | “Would this isolate a sub-network?”        |
| **Update loop**          | Revise pencil marks                     | Revise hidden model                           | Revise bridge/non-bridge map               |
| **Transfer abstraction** | Constraint-preserving allocation        | Opaque-system testing                         | Network integration                        |

The key difference is that Bridges adds **global connectedness** as a first-class requirement. A move can satisfy local island numbers and still be wrong if it traps a closed subset away from the rest of the system.

## 2. Bridges-specific mindware

| Bridges mindware                  | Cognitive function                                               | Prompt handle                                               |
| --------------------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| **Degree constraint**             | Each island has a required number of bridge-ends                 | “How many connections does this node still need?”           |
| **Connection budget**             | Single/double bridges allocate limited capacity                  | “How much of this island’s budget should be spent here?”    |
| **Candidate-link scan**           | Identify legal horizontal/vertical neighbours                    | “Which islands can this island still connect to?”           |
| **Non-crossing constraint**       | Prevent one connection from blocking another                     | “Would this link block a future route?”                     |
| **Connectivity check**            | Ensure all islands form one network                              | “Does this move keep the whole system connectable?”         |
| **Closed-subset avoidance**       | Avoid completing a small isolated component too early            | “Am I creating a self-contained group?”                     |
| **Bottleneck island**             | Find islands with few possible routes                            | “Which island is most at risk of isolation?”                |
| **Forced bridge detection**       | Detect links that must exist to satisfy local/global constraints | “Which connection is now forced?”                           |
| **Non-bridge marking**            | Record impossible or strategically excluded links                | “What can I safely mark as not connected?”                  |
| **Network completion discipline** | Finish nodes only when local and global constraints agree        | “Is this island truly complete, or just locally satisfied?” |

This is excellent mindware because it teaches that **local completion is not enough**. A node can look solved while the whole system remains structurally invalid.

## 3. Bridges as a mindware mission

### Core cue

```text
How do I connect the whole system without violating local constraints?
```

This is the Bridges equivalent of:

```text
Towers:
What constraints must remain true after each move?

Black Box:
What test gives the most information about the hidden structure?

Bridges:
What connection keeps the whole network viable?
```

## 4. In-game micro-prompts

Use these as optional “Think” prompts, not constant interruptions.

```text
How many bridges does this island still need?

Which neighbours can it legally connect to?

Would a bridge here cross or block another route?

Would this move isolate a small group?

Which island has the fewest remaining options?

Is this a local completion or a globally safe completion?

What bridge is forced if the whole network must stay connected?
```

## 5. Bridges-specific mission scripts

For MVP, I would give Bridges four named mindware scripts.

### 1. Node Budget

**Purpose:** Train local resource accounting.

```text
Every island has a connection budget.
Count what is already used.
Count what remains.
Do not spend the budget before checking the network.
```

User-facing prompts:

```text
What does this node still need?
Where can those connections still go?
Would one double bridge overcommit the node?
```

Everyday wrapper:

```text
A person, project or department has limited capacity.
Before adding a commitment, ask what capacity remains and where it should be allocated.
```

###  Open Network

**Purpose:** Prevent premature closure.

```text
A group can look complete but still be wrong if it cannot connect to the rest.
Before closing a cluster, check whether it still has a route outward.
```

User-facing prompts:

```text
Is this group becoming isolated?
Does it still have an exit route?
Am I completing a part too early?
```

Everyday wrapper:

```text
A team can optimise internally while disconnecting from the wider organisation.
A product feature can work locally while failing to fit the whole user journey.
```

###  Bottleneck Link

**Purpose:** Detect structurally critical connections.

```text
Some islands have many possible links.
Others have almost none.
Work from the bottlenecks first.
```

User-facing prompts:

```text
Which island has the fewest legal options?
Which connection would become impossible if I delay it?
Which bridge preserves future options?
```

Everyday wrapper:

```text
In a project, the bottleneck is often the task, person or dependency with the fewest viable routes.
Solve that first.
```

###  No-Crossing Route

**Purpose:** Train interference-aware planning.

```text
A connection can be locally valid but globally damaging if it blocks another path.
Check whether the route interferes with other routes.
```

User-facing prompts:

```text
Would this bridge cross a future bridge?
Does this route block another island’s only route?
Can I satisfy this island without cutting off another?
```

Everyday wrapper:

```text
One decision can consume time, money, attention or social capital in a way that blocks another necessary decision.
```

## 6. Bridges post-mission reflection

Use one shared reflection plus one Bridges-specific reflection.

**Shared:**

```text
What did you learn about the problem space?
```

**Bridges-specific:**

```text
Which connection kept the whole network viable?
```

Other useful reflections:

```text
Where did local completion threaten global connection?

Which island acted as the bottleneck?

Did you solve by filling obvious bridges, or by protecting network viability?

What move changed the structure of the whole puzzle?
```

## 7. Real-world transfer prompts

Bridges has very strong everyday transfer potential.

### Work / project management

```text
Where is one project where all parts need to connect, not just be individually completed?
```

### Business strategy

```text
Which part of the business is currently an isolated island that needs a bridge to the rest of the system?
```

### Team coordination

```text
Who or what needs to be connected so that information can flow across the whole group?
```

### Learning / course design

```text
Which concept is acting as a bridge between separate topics?
```

### Personal planning

```text
Which commitment looks locally useful but may block another necessary route?
```

### Implementation intention

```text
When I face a complex project with many parts, I will first identify the bottleneck node and ask which connection keeps the whole system viable.
```

## 8. How Bridges completes the foundational set

The three-game set now has a very clean cognitive architecture:

| Game          | Core problem type                                                                   | Main fluid-intelligence lane                                      | Everyday interpretation                                                         |
| ------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Towers**    | Fill a visible grid while preserving row, column and visibility constraints         | Constraint satisfaction, ordinal reasoning, controlled allocation | Scheduling, prioritisation, rule-bound planning                                 |
| **Black Box** | Infer hidden objects from indirect beam evidence                                    | Abduction, probe selection, latent-cause modelling                | Debugging, diagnosis-like reasoning, market testing, scientific inference       |
| **Bridges**   | Connect all numbered islands without crossings while satisfying local bridge counts | Network integration, systems coherence, bottleneck reasoning      | Team coordination, project architecture, workflow design, dependency management |

That is a strong Mission Arena foundation because each game trains a different mode of strategic cognition:

```text
Towers:
Can I preserve visible constraints while filling a structured space?

Black Box:
Can I infer a hidden structure by choosing informative tests?

Bridges:
Can I build a connected system where local constraints and global coherence both hold?
```

## 9. Suggested Mission Arena v1 structure

For the third game, I would introduce Bridges as the **Network Mission**.

```text
Mission Arena v1 foundational set

1. Towers
   Lane: Constraint Mission
   Core cue: What must remain true?

2. Black Box
   Lane: Probe Mission
   Core cue: What test gives the most information?

3. Bridges
   Lane: Network Mission
   Core cue: What connection keeps the whole system viable?
```

This gives you a product-facing triad that is easy to explain and easy to turn into mission prompts:

```text
Constrain.
Probe.
Connect.
```

 

That is a strong Mission Arena foundation. It avoids the weak claim that puzzles alone produce far transfer, while making the stronger, evidence-aligned claim that puzzles plus explicit prompts, wrapper variation, reflection, feedback and delayed re-use can train compact applied reasoning templates. The review explicitly warns against claiming that puzzles alone improve decision-making or planning, and recommends pairing puzzles with prompts, varied wrappers, missions and delayed probes. 
