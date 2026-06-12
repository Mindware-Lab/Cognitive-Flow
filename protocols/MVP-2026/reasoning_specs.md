# IQ Coach — Reasoning layer (Component 4) Specification

## Explicit Relational Reasoning Layer / Reasoning Gym

**Status:** Draft v0.1
**Product:** IQ Coach
**Layer:** Component 4 — Explicit Reasoning
**Depends on:**

* Component 1: Arrow-based C-Control / Cognitive Bandwidth
* Component 2: Arrow-based relational n-back / Majority Memory
* Component 3: Gabor Pattern Binding + SR Path Prediction

**Not included in this spec:**

* Long-form coaching prompts
* Real-world mission planning
* Open-ended writing tasks
* LLM-assisted reasoning
* General IQ test replacement claims
* Clinical interpretation

---

# 1. Core purpose

Component 4 trains explicit relational reasoning by mapping the four SR transformation families from Component 3 into symbolic, verbal and nonsense-semantic reasoning tasks.

The layer moves from:

```text
visual relation recovery
→ explicit premise relation
→ validity judgement
→ mixed-operation reasoning
→ wrapper recovery
→ delayed transfer check
```

Consumer-facing labels:

```text
Reasoning Transfer
Rule Recovery
Logic Flexibility
Reasoning Capacity
```

Technical labels:

```text
ERRC
ERRC_Order
ERRC_Transform
ERRC_Constraint
ERRC_Path
ERRC_Mixed
R-WRecovery
R-Delay
```

---

# 2. Core continuity with SR layer

Component 3 trains four SR transformation families:

```text
1. Order & Chains
2. Transformations & Analogies
3. Rules & Constraints
4. Prediction & Strategy
```

Component 4 maps these into four explicit reasoning domains:

```text
1. Order / Chain Reasoning
2. Transformation / Analogy Reasoning
3. Rule / Constraint Reasoning
4. Prediction / Strategic Path Reasoning
```

The same invariant relation should be carried upward:

```text
Gabor stream relation
→ symbolic reasoning item
→ real-language reasoning item
→ nonsense-semantic reasoning item
→ delayed mixed-wrapper re-check
```

Example:

```text
SR stream:
A > B > C

Symbolic:
A > B, B > C, therefore A > C

Real language:
Mira is more experienced than Leo.
Leo is more experienced than Sam.
Therefore, Mira is more experienced than Sam.

Nonsense semantics:
The flarn is taller than the nidge.
The nidge is taller than the borp.
Therefore, the flarn is taller than the borp.
```

---

# 3. Three reasoning wrappers

Every reasoning form must be trainable across three wrappers.

## 3.1 Symbolic wrapper

Uses:

```text
A, B, C, X, Y
>, <, =
AND, OR, XOR
IF...THEN
P(B|A)
```

Purpose:

```text
train pure formal structure
```

Example:

```text
A > B
B > C
Therefore, A > C.
```

---

## 3.2 Real-language wrapper

Uses meaningful applied examples.

Domains can include:

```text
work decisions
study planning
project priorities
client examples
health-neutral everyday examples
learning examples
```

Purpose:

```text
recover the same relation inside meaningful language
```

Example:

```text
Plan A is safer than Plan B.
Plan B is safer than Plan C.
Therefore, Plan A is safer than Plan C.
```

---

## 3.3 Nonsense-semantic wrapper

Uses invented terms or deliberately unfamiliar content.

Purpose:

```text
separate logical validity from plausibility
reduce belief-bias shortcuts
test form over content
```

Example:

```text
The flarn is heavier than the nidge.
The nidge is heavier than the borp.
Therefore, the flarn is heavier than the borp.
```

The content is meaningless, but the relation is valid.

---

# 4. Core response types

Reasoning items should use a small set of response formats.

## 4.1 Validity format

```text
Valid
Invalid
Cannot tell
```

Use for:

```text
transitivity
conjunction
XOR
hierarchy
identity
indeterminate lures
```

## 4.2 Same-relation format

```text
Same relation
Different relation
```

Use for:

```text
analogy
same-change
equivalence
transformation mapping
```

## 4.3 Path format

```text
Likely
Unlikely
Cannot tell
```

or:

```text
On path
Blocked
Cannot tell
```

Use for:

```text
conditional probability
reachability
counterfactual path
strategic prediction
```

## 4.4 Best-conclusion format

Later, use:

```text
Which conclusion follows?
A
B
C
Cannot tell
```

This gives a higher-information response than binary validity.

MVP should start with validity and same-relation formats.

---

# 5. Four reasoning domains

---

# 5A. Order / Chain Reasoning

Maps from SR family:

```text
Order & Chains
```

Consumer-facing skill:

```text
Follow a chain of comparisons without over-inferring.
```

Internal metric:

```text
ERRC_Order
```

## 5A.1 Supported operations

```text
direct comparison
transitive chain
reversed premise order
mixed direction chain
identity + chain
indeterminate lure
delayed chain
```

## 5A.2 Level ladder

### Level 1 — Direct comparison

```text
A > B
Therefore, A outranks B.
```

### Level 2 — Two-premise transitivity

```text
A > B
B > C
Therefore, A > C.
```

### Level 3 — Three-premise chain

```text
A > B
B > C
C > D
Therefore, A > D.
```

### Level 4 — Reversed premise order

```text
B < A
C < B
Therefore, A > C.
```

### Level 5 — Identity + chain

```text
X = A
A > B
B > C
Therefore, X > C.
```

### Level 6 — Indeterminate lure

```text
A > B
C > B
Therefore, A > C.
```

Correct response:

```text
Cannot tell
```

### Level 7 — Delayed mixed chain

```text
X = A
Distractor
A > B
B > C
Therefore, X > C.
```

## 5A.3 Example real-language item

```text
The recommended supplier is Supplier A.
Supplier A is more reliable than Supplier B.
Supplier B is more reliable than Supplier C.
Therefore, the recommended supplier is more reliable than Supplier C.
```

Correct:

```text
Valid
```

## 5A.4 Lures

```text
shared lower anchor
reversed relation
wrong identity substitution
chain broken by distractor
plausible but unsupported conclusion
```

---

# 5B. Transformation / Analogy Reasoning

Maps from SR family:

```text
Transformations & Analogies
```

Consumer-facing skill:

```text
Recognise the same change under a new surface.
```

Internal metric:

```text
ERRC_Transform
```

## 5B.1 Supported operations

```text
difference size
progression
same-change
analogy
equivalence class
identity + analogy
cross-wrapper analogy
```

## 5B.2 Level ladder

### Level 1 — Difference size

```text
A → B = +2
C → D = +1
Therefore, A→B is the larger change.
```

### Level 2 — Simple progression

```text
A → B = +1
B → C = +1
Therefore, C → D should be +1 if the pattern continues.
```

### Level 3 — Same-change analogy

```text
A → B = +2
C → D = +2
Therefore, A:B and C:D have the same relation.
```

### Level 4 — Analogy with changed surface

```text
A becomes B by adding support.
C becomes D by adding setup.
Both changes convert a basic offer into a premium offer.
```

### Level 5 — Identity + analogy

```text
X = A
A:B :: C:D
Therefore, X:B :: C:D.
```

### Level 6 — Equivalence class

```text
A → C
B → C
Therefore, A and B are equivalent with respect to C.
```

### Level 7 — Equivalence + substitution

```text
A ≡ B with respect to outcome C
X = A
Therefore, X can be treated like B for predicting C.
```

## 5B.3 Example real-language item

```text
A free plan becomes a premium plan by adding priority support.
A basic onboarding service becomes premium onboarding by adding live setup.
Therefore, both changes convert a basic offer into a higher-support offer.
```

Correct:

```text
Same relation
```

## 5B.4 Lures

```text
same endpoint but different transformation
same direction but different step size
surface similarity without structural similarity
identity substitution into the wrong role
equivalence overgeneralised beyond the specified outcome
```

---

# 5C. Rule / Constraint Reasoning

Maps from SR family:

```text
Rules & Constraints
```

Consumer-facing skill:

```text
Know what must be true, what cannot be true, and when a rule applies.
```

Internal metric:

```text
ERRC_Constraint
```

## 5C.1 Supported operations

```text
identity binding
conjunction
missing-condition lure
XOR / mutual exclusion
hierarchy / context rule
conjunction + identity
XOR + hierarchy
constraint reachability
```

## 5C.2 Level ladder

### Level 1 — Simple identity substitution

```text
X = A
A has property P
Therefore, X has property P.
```

### Level 2 — Conjunction

```text
A AND B → C
A is present
B is present
Therefore, C follows.
```

### Level 3 — Missing-condition lure

```text
A AND B → C
A is present
B is absent
Therefore, C follows.
```

Correct:

```text
Invalid
```

### Level 4 — XOR

```text
A XOR B
A is true
Therefore, B is false.
```

### Level 5 — Hierarchy / context rule

```text
If context K, A → B
If context L, A → C
Context L is active
A occurred
Therefore, C follows.
```

### Level 6 — Identity + conjunction

```text
X = A
Y = B
A AND B → C
X and Y are present
Therefore, C follows.
```

### Level 7 — Hierarchy + XOR

```text
In context K, A XOR B
Context K is active
A is true
Therefore, B is false.
```

### Level 8 — Conjunction + transitivity

```text
A AND B → C
C > D
A is present
B is present
Therefore, C > D.
```

### Level 9 — Identity + conjunction + transitivity

```text
X = A
Y = B
A AND B → C
C > D
X and Y are present
Therefore, C > D.
```

This is a key higher-level mixed item because it combines binding, conjunction and order reasoning.

## 5C.3 Example real-language item

```text
A lead becomes high priority only if they have budget and urgent need.
This lead has budget.
This lead has urgent need.
High-priority leads should be contacted before low-priority leads.
Therefore, this lead should be contacted before low-priority leads.
```

Correct:

```text
Valid
```

## 5C.4 Lures

```text
single condition treated as sufficient
wrong context selected
XOR treated as inclusive OR
identity mapped to wrong symbol
valid local rule applied under invalid global context
```

---

# 5D. Prediction / Strategic Path Reasoning

Maps from SR family:

```text
Prediction & Strategy
```

Consumer-facing skill:

```text
Use rules to predict likely paths, blocked paths and counterfactual alternatives.
```

Internal metric:

```text
ERRC_Path
```

## 5D.1 Supported operations

```text
conditional probability
path reachability
rare versus impossible successor
branching path
counterfactual path
equivalence + probability
counterfactual + probability
delayed path recovery
```

## 5D.2 Level ladder

### Level 1 — Simple conditional probability

```text
P(B | A) is high.
A occurred.
Therefore, B is likely.
```

### Level 2 — Compare two probabilistic paths

```text
P(B | A) is high.
P(C | A) is low.
A occurred.
Therefore, B is more likely than C.
```

### Level 3 — Qualitative probabilistic chain

```text
A usually leads to B.
B usually leads to C.
A occurred.
Therefore, C is plausibly reachable through B.
```

### Level 4 — Reachability

```text
From A, only paths through B can reach target T.
The current path moved from A to C.
C cannot reach T.
Therefore, the target is blocked.
```

### Level 5 — Counterfactual path

```text
From A, path B or path C was possible.
Path B was taken.
Therefore, path C was not taken, but was possible from A.
```

### Level 6 — Counterfactual + outcome

```text
A → B usually leads to X.
A → C usually leads to Y.
B was chosen.
Therefore, X was the expected actual path and Y was the counterfactual path.
```

### Level 7 — Equivalence + conditional probability

```text
A ≡ B with respect to outcome C.
P(C | A) is high.
Therefore, P(C | B) is also high.
```

### Level 8 — Hierarchy + conditional probability

```text
In context K, A usually leads to B.
In context L, A usually leads to C.
Context L is active.
A occurred.
Therefore, C is the more likely path.
```

## 5D.3 Example real-language item

```text
A demo request and a technical integration question are both high-intent signals.
Demo requests usually predict conversion.
A customer asked a technical integration question.
Therefore, conversion should be treated as more likely than baseline.
```

Correct:

```text
Valid
```

## 5D.4 Lures

```text
rare treated as impossible
possible treated as likely
old path treated as still reachable
wrong context probability used
equivalent class overextended to a different outcome
counterfactual path treated as actual
```

---

# 6. Mixed-operation reasoning

As the game progresses, items must combine operations.

This is essential. The app should not stay within isolated forms such as “just transitivity” or “just conjunction”.

## 6.1 Mixed-operation families

Supported combinations:

```text
identity + transitivity
identity + analogy
identity + conjunction
conjunction + transitivity
XOR + hierarchy
equivalence + probability
counterfactual + probability
hierarchy + probability
identity + conjunction + transitivity
delayed identity + mixed operation
```

## 6.2 Mixed example: conjunction + transitivity

Symbolic:

```text
A AND B → C
C > D
A
B
Therefore, C > D.
```

Real language:

```text
A lead is high priority only if they have budget and urgent need.
This lead has budget.
This lead has urgent need.
High-priority leads rank above low-priority leads.
Therefore, this lead ranks above low-priority leads.
```

Nonsense:

```text
A zindle becomes a norp only if it is blue and hollow.
This zindle is blue.
This zindle is hollow.
Norps outrank vells.
Therefore, this zindle outranks vells.
```

## 6.3 Mixed example: hierarchy + XOR

Symbolic:

```text
In context K, A XOR B.
K is active.
A is true.
Therefore, B is false.
```

## 6.4 Mixed example: equivalence + probability

Symbolic:

```text
A ≡ B for outcome C.
P(C | A) is high.
Therefore, P(C | B) is high.
```

## 6.5 Mixed example: delayed identity + conjunction

Symbolic:

```text
X = A.
Distractor.
Y = B.
A AND B → C.
X and Y are present.
Therefore, C follows.
```

This should be a high-level item because it requires identity binding, delay tolerance and conjunctive reasoning.

---

# 7. Reasoning capacity metric

The core metric is:

```text
ERRC = Explicit Relational Reasoning Capacity
```

Definition:

```text
The maximum premise-relation-binding demand a learner can solve above criterion across symbolic, real-language and nonsense-semantic wrappers, including lures and delayed re-checks.
```

User-facing label:

```text
Reasoning Transfer Capacity
```

or:

```text
Reasoning Capacity
```

---

# 8. Demand model

Each reasoning item gets a structured demand score.

```text
D_reason =
  α(PremiseCount)
+ β(RelationCount)
+ γ(IdentityBindingCount)
+ δ(OperationMix)
+ ε(LurePressure)
+ ζ(WrapperDifficulty)
+ η(Delay)
+ θ(ResponseSetComplexity)
```

Where:

```text
PremiseCount
= number of explicit premises

RelationCount
= number of relational links

IdentityBindingCount
= temporary substitutions such as X = A

OperationMix
= number and type of combined reasoning operations

LurePressure
= similarity and attractiveness of wrong conclusion

WrapperDifficulty
= symbolic, real-language, nonsense, mixed

Delay
= distractor or delayed re-entry pressure

ResponseSetComplexity
= binary validity vs three-way cannot-tell vs multi-choice conclusion
```

Fit:

```text
P(correct) =
chance + usable_range × sigmoid(ERRC_theta − D_reason)
```

Report both:

```text
current level passed
fitted reasoning capacity
confidence label
```

---

# 9. Subscale metrics

Estimate separate subscales.

```text
ERRC_Order
ERRC_Transform
ERRC_Constraint
ERRC_Path
ERRC_Mixed
```

Also estimate transfer metrics:

```text
R-WRecovery = reasoning wrapper recovery
R-Delay = delayed reasoning recovery
R-Lure = reasoning lure resistance
R-Bind = identity-binding reasoning cost
```

## 9.1 Reasoning wrapper recovery

```text
R-WRecovery =
performance_after_wrapper_shift / performance_before_wrapper_shift
```

Example:

```text
symbolic transitivity = 90%
real-language transitivity = 82%
nonsense-semantics transitivity = 74%

nonsense wrapper recovery = 74 / 90 = .82
```

## 9.2 Reasoning delayed recovery

```text
R-Delay =
delayed mixed-wrapper performance / immediate mixed-wrapper performance
```

## 9.3 Reasoning lure resistance

```text
R-Lure =
1 - false_acceptance_rate_of_lure_conclusions
```

Lure examples:

```text
believable but invalid
valid but unbelievable / nonsense
cannot-tell treated as valid
single condition treated as sufficient
rare treated as impossible
```

## 9.4 Identity-binding reasoning cost

```text
R-BindCost =
performance_without_identity_bindings - performance_with_identity_bindings
```

This captures the extra cost of temporary role/filler mapping.

---

# 10. Difficulty ladder

Use a shared 10-level ladder across domains.

| Level | Structure                     | Example                                               |                       |          |
| ----: | ----------------------------- | ----------------------------------------------------- | --------------------- | -------- |
|     1 | One relation                  | `A > B`                                               |                       |          |
|     2 | Two premises, same relation   | `A > B, B > C therefore A > C`                        |                       |          |
|     3 | Three premises, same relation | `A > B, B > C, C > D therefore A > D`                 |                       |          |
|     4 | Identity + one relation       | `X = A, A > B therefore X > B`                        |                       |          |
|     5 | Identity + chain              | `X = A, A > B, B > C therefore X > C`                 |                       |          |
|     6 | Two identities + conjunction  | `X = A, Y = B, A AND B → C, X and Y therefore C`      |                       |          |
|     7 | Mixed operations              | `A ≡ B, P(C                                           | A) high therefore P(C | B) high` |
|     8 | Lure / cannot tell            | `A > B, C > B therefore A ? C unknown`                |                       |          |
|     9 | Delayed mixed relation        | identity or chain survives distractor                 |                       |          |
|    10 | Cross-wrapper mixed block     | symbolic + real-language + nonsense items interleaved |                       |          |

---

# 11. Adaptive progression

Use the same adaptive band as the earlier layers.

```text
Target balanced accuracy = 70–82%
```

Rules:

```text
If >85% for two mini-blocks:
    increase one demand dimension.

If 70–82%:
    maintain.

If 60–70%:
    repeat with support.

If <60%:
    reduce demand.
```

Demand dimensions:

```text
premise count
relation count
identity-binding count
operation mix
lure pressure
wrapper difficulty
delay
response set complexity
```

Only increase one dimension at a time.

---

# 12. Horizontal wrapper cycle

Use the same horizontal cycle:

```text
Plateau
→ Perturb
→ Recover
→ Mix
→ Plateau
→ Expand
```

For each target reasoning invariant `R`:

```text
1. Train R in easiest wrapper until local learning curve flattens.
2. Shift to second wrapper while preserving R.
3. Expect a temporary dip.
4. When recovery begins, mix wrapper 1 + wrapper 2.
5. Train mixed wrappers until performance stabilises.
6. Add third wrapper.
7. Mix all wrappers.
8. Bank the relation only if delayed mixed-wrapper performance passes.
```

Recommended wrapper order:

```text
symbolic
→ real-language
→ nonsense-semantics
→ mixed
```

But if symbolic is too abstract for some users, allow:

```text
real-language
→ symbolic
→ nonsense-semantics
→ mixed
```

The app should choose the most accessible first wrapper from onboarding performance.

---

# 13. Relationship to SR training

Every reasoning block should know the preceding SR family.

Example mapping:

| SR family                   | Reasoning domain                      | Reasoning examples                                   |
| --------------------------- | ------------------------------------- | ---------------------------------------------------- |
| Order & Chains              | Order / Chain Reasoning               | comparison, transitivity, reversal, cannot-tell      |
| Transformations & Analogies | Transformation / Analogy Reasoning    | progression, same-change, analogy, equivalence       |
| Rules & Constraints         | Rule / Constraint Reasoning           | identity, conjunction, XOR, hierarchy, constraints   |
| Prediction & Strategy       | Prediction / Strategic Path Reasoning | probability, reachability, counterfactual, branching |

## 13.1 Same-day bridge

If the SR block trained:

```text
Order & Chains
```

the reasoning block should use:

```text
Order / Chain Reasoning
```

If the SR block trained:

```text
Rules & Constraints
```

the reasoning block should use:

```text
Rule / Constraint Reasoning
```

## 13.2 Mixed-day review

Later sessions should deliberately mix domains:

```text
SR: Transformations & Analogies
Reasoning: analogy + equivalence + conditional probability
```

This is where the app tests whether trained relation families can combine.

---

# 14. Reasoning block design

A reasoning block should be short, explicit and adaptive.

## 14.1 Standard reasoning block

```text
Instruction card: 10–20 sec
4–8 reasoning items
brief feedback after each item
post-block summary
```

Duration:

```text
3–5 minutes
```

## 14.2 Full benchmark block

Use every 5–7 sessions.

```text
12–24 reasoning items
mixed wrappers
mixed domains
delayed items from earlier sessions
```

Duration:

```text
8–12 minutes
```

## 14.3 Daily bridge block

Use after SR training.

```text
same relation family as SR block
one wrapper focus
1–2 lures
one mixed item if ready
```

Duration:

```text
2–4 minutes
```

---

# 15. Feedback design

Reasoning feedback can be slightly more explicit than SR feedback, but still short.

Correct:

```text
Correct — the conclusion follows.
```

Incorrect:

```text
Not quite — one condition is missing.
```

Cannot-tell lure:

```text
Cannot tell — both are above B, but their relation to each other is not given.
```

Belief-bias lure:

```text
The conclusion sounds plausible, but it does not follow from these premises.
```

Delayed binding error:

```text
The label X referred to A, not B.
```

Do not provide long teaching explanations during adaptive gameplay.

Detailed explanation can be shown after the block if the user taps:

```text
Show why
```

---

# 16. Item schema

Each item should be generated from a formal template.

## 16.1 Reasoning item fields

```text
id
reasoning_domain
sr_family_source
operation_tags
wrapper_type
premises
conclusion
correct_response
response_options
difficulty_level
premise_count
relation_count
identity_binding_count
operation_mix_count
lure_type
delay_condition
source_relation_id
explanation_short
explanation_long
```

## 16.2 Operation tags

```text
identity
comparison
transitivity
reversal
indeterminate
difference
progression
analogy
equivalence
conjunction
xor
hierarchy
conditional_probability
reachability
counterfactual
delay
mixed
```

---

# 17. Data model

## 17.1 Tables

```text
reasoning_sessions
reasoning_blocks
reasoning_items
reasoning_trials
reasoning_estimates
reasoning_wrapper_states
reasoning_delayed_probes
```

## 17.2 Trial fields

```text
id
user_id
session_id
block_id
item_id
trial_index
reasoning_domain
sr_family_source
wrapper_type
operation_tags_json
difficulty_level
d_reason
premise_count
relation_count
identity_binding_count
operation_mix_count
lure_type
delay_condition
response
correct_response
is_correct
rt_ms
confidence_rating_optional
feedback_type
created_at
```

## 17.3 Estimate fields

```text
id
user_id
session_id
metric_name
reasoning_domain
wrapper_type
capacity_estimate
capacity_unit
balanced_accuracy
d_prime
false_acceptance_rate
cannot_tell_accuracy
identity_binding_cost
wrapper_recovery_ratio
delayed_recovery_ratio
confidence_label
created_at
```

---

# 18. Adaptive item selection

## 18.1 Select next item

```text
function selectReasoningItem(userState, blockGoal):

    identify active reasoning domain
    identify active wrapper
    estimate current ERRC_theta
    build candidate item set
    remove recently repeated surface items
    favour items near current threshold
    include controlled lure rate
    include one bridge item from current SR family
    return highest expected information item
```

## 18.2 Adapt after mini-block

```text
function updateReasoningLevel(blockScore):

    if balanced_accuracy > 0.85
       and lure_false_acceptance low
       and cannot_tell accuracy acceptable:
           increase one demand dimension

    else if balanced_accuracy between 0.70 and 0.82:
           maintain

    else if balanced_accuracy between 0.60 and 0.70:
           repeat with support

    else:
           reduce demand
```

---

# 19. Lure taxonomy

## 19.1 Believable-invalid lure

The conclusion sounds plausible but does not follow.

## 19.2 Valid-unbelievable lure

The conclusion sounds strange but follows from the premises.

## 19.3 Cannot-tell lure

The premises are insufficient.

## 19.4 Missing-condition lure

A conjunction is treated as satisfied when one condition is absent.

## 19.5 Wrong-identity lure

The user substitutes the wrong temporary label.

## 19.6 Wrong-context lure

A local rule is applied under the wrong global context.

## 19.7 Over-equivalence lure

An equivalence class is applied beyond its specified outcome.

## 19.8 Counterfactual-confusion lure

A possible alternative path is treated as the actual path.

---

# 20. User-facing outputs

Daily result summary:

```text
Reasoning Transfer: Level 4
Current focus: Order / Chain Reasoning
Wrapper: real language
Lure Resistance: improving
Next: same rule in nonsense examples
```

Weekly profile:

```text
Order & Chain Reasoning
Transformation & Analogy Reasoning
Rule & Constraint Reasoning
Prediction & Strategy Reasoning
Mixed Reasoning
Reasoning Wrapper Recovery
Delayed Reasoning Recovery
```

Technical profile:

```text
ERRC_Order
ERRC_Transform
ERRC_Constraint
ERRC_Path
ERRC_Mixed
R-WRecovery
R-Delay
R-Lure
R-BindCost
```

---

# 21. Integration with total IQ Coach dashboard

Component 4 completes the vertical stack:

```text
Cognitive Bandwidth
→ Frame Bandwidth
→ Pattern Binding
→ Change Tracking
→ Path Prediction
→ Reasoning Transfer
→ Transfer Score
```

Dashboard groups:

```text
Control & Focus:
Cognitive Bandwidth
Frame Bandwidth

Working Memory & Prediction:
Pattern Binding
Change Tracking
Path Prediction

Reasoning & Transfer:
Reasoning Transfer
Lure Resistance
Wrapper Recovery
Delayed Recovery
Reasoning Benchmark
```

---

# 22. Build order

```text
1. Formal reasoning template engine
2. Symbolic wrapper renderer
3. Valid / Invalid / Cannot tell response system
4. Order / Chain reasoning templates
5. Identity-binding templates
6. Conjunction templates
7. Real-language wrapper renderer
8. Nonsense-semantic wrapper renderer
9. Lure taxonomy
10. Adaptive item selection
11. ERRC scoring
12. Wrapper recovery controller
13. Mixed-operation templates
14. Delayed reasoning probes
15. Full benchmark mode
```

---

# 23. MVP scope

MVP should include:

```text
symbolic wrapper
real-language wrapper
nonsense-semantic wrapper

Order / Chain Reasoning
Transformation / Analogy Reasoning
Rule / Constraint Reasoning
Prediction / Strategic Path Reasoning

valid / invalid / cannot tell
same / different
on path / blocked / cannot tell

identity + transitivity
identity + conjunction
conjunction + transitivity
equivalence + probability
hierarchy + XOR
counterfactual + probability

ERRC scoring
reasoning wrapper recovery
delayed reasoning recovery
```

MVP should not include:

```text
long-form written explanations
open-ended reasoning essays
LLM-generated item creation without review
clinical reasoning labels
official IQ-score claims
social/political persuasion tasks
```

---

# 24. Claims boundary

The app may say:

```text
Reasoning Gym trains explicit relational reasoning.
It tests whether rules trained visually can be recovered in symbols, language and unfamiliar examples.
It tracks reasoning capacity through premise load, relation load, binding load, lure resistance and wrapper recovery.
```

The app should not say:

```text
This is a full IQ test.
This proves IQ increase.
This diagnoses reasoning impairment.
This guarantees far transfer.
```

Safe technical wording:

```text
The explicit reasoning layer estimates how well users recover, combine and apply relational structures across multiple reasoning wrappers and delayed re-checks.
```

---

# 25. Final summary

Component 4 completes IQ Coach.

It maps the four SR transformation families into four explicit reasoning domains:

```text
Order & Chains
→ Order / Chain Reasoning

Transformations & Analogies
→ Transformation / Analogy Reasoning

Rules & Constraints
→ Rule / Constraint Reasoning

Prediction & Strategy
→ Prediction / Strategic Path Reasoning
```

It uses three reasoning wrappers:

```text
symbolic
real-language
nonsense-semantics
```

It supports mixed-operation growth:

```text
identity + transitivity
conjunction + transitivity
identity + conjunction
hierarchy + XOR
equivalence + probability
counterfactual + probability
```

Its core metric is:

```text
ERRC = Explicit Relational Reasoning Capacity
```

defined as:

```text
the maximum premise-relation-binding demand solved above criterion across wrappers, lures and delayed re-checks.
```

This gives the full IQ Coach stack:

```text
controlled evidence extraction
→ relational evidence extraction
→ associative binding
→ relational WM
→ SR path prediction
→ explicit relational reasoning
→ wrapper recovery
→ delayed transfer
```
