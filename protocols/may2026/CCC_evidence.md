# Cognitive Control Capacity (CCC)

Wu, T., Dufford, A. J., Mackie, M.-A., Egan, L. J., & Fan, J. (2016). The capacity of cognitive control estimated from a perceptual decision making task. Scientific Reports, 6, Article 34025. https://doi.org/10.1038/srep34025
The **bits/sec claim** is a model-based information-theoretic estimate of how much task-relevant information a person can bring under cognitive control per unit time in the MFT-M paradigm. The paper’s central claim is that cognitive control capacity, estimated from the backward-masking Majority Function Task, is approximately **3–4 bits per second**.  Nature’s summary of the paper states the same core logic: the authors varied stimulus uncertainty and exposure time, then fitted response accuracy as a function of information rate to estimate CCC in bps. ([Nature][1])

## 1. The basic idea

The paper treats cognitive control like a capacity-limited information channel.

The logic is:

```text
If the task requires little controlled information per second,
accuracy should be high.

If the task requires more controlled information per second than the person can handle,
accuracy should fall towards guessing.
```

So CCC is inferred from the point at which increasing task information rate starts to overwhelm accurate majority judgement.

## 2. What the MFT-M task manipulates

Participants see a brief display of arrows and must report the **majority direction**. The task varies two things:

| Manipulation       | Meaning                                                   |
| ------------------ | --------------------------------------------------------- |
| **Majority ratio** | How much uncertainty/conflict is in the arrow set         |
| **Exposure time**  | How long the person has to extract the majority direction |

The hardest condition is something like:

```text
3 arrows point one way
2 arrows point the other way
displayed for 250 ms
then masked
```

This requires fast controlled sampling of conflicting perceptual evidence.

## 3. Why majority ratio becomes “bits”

The authors assume a **grouping search strategy**. The participant samples a group of arrows large enough to determine the majority. For a set of 5 arrows, the majority size is 3. The person keeps sampling groups until they find a **congruent sample**, meaning all sampled arrows point in the same direction.

The probability of getting a congruent sample on one attempt is called:

```text
Pgroup
```

The average amount of search required is then:

```text
Nmaj / Pgroup
```

where:

```text
Nmaj = number of arrows needed for a majority sample
```

The information load is defined as:

```text
Entropy = log2(Nmaj / Pgroup)
```

For example, in the 3:2 condition:

```text
Nmaj = 3
Pgroup = 0.10

Entropy = log2(3 / 0.10)
        = log2(30)
        ≈ 4.91 bits
```

So the 3:2 condition is much harder than a 5:0 congruent condition because the participant may need far more sampling to find decisive evidence. 

## 4. How this becomes bits per second

The exposure time determines how quickly that information must be processed.

The paper defines information rate as the log-transformed number of arrows that would need to be scanned per second:

```text
R = log2((Nmaj / Pgroup) / ET)
```

So for the 3:2 condition with a 250 ms exposure:

```text
R = log2(30 / 0.25)
  = log2(120)
  ≈ 6.91 bps
```

That is far above the estimated average CCC, so accuracy should be poor.

For the same 3:2 condition with a 2 s exposure:

```text
R = log2(30 / 2)
  = log2(15)
  ≈ 3.91 bps
```

That is closer to the estimated CCC range, so accuracy should be better.

This is why the same majority ratio becomes easier when exposure time increases.

## 5. The model’s key assumption: voluntary versus forced termination

The model assumes two possible outcomes during a trial:

```text
Voluntary termination:
The participant finds a congruent sample before the display disappears.
Response is likely correct.

Forced termination:
The display disappears before the participant finds a congruent sample.
The participant guesses.
```

The probability of voluntary termination is:

```text
PVT = 1 - (1 - Pgroup)^ns
```

where:

```text
ns = number of possible samples before masking
```

The number of samples depends on the person’s capacity `C` and the exposure time:

```text
ns = (2^C × ET) / Nmaj
```

So a higher-capacity person can sample more information before the mask appears.

## 6. Expected accuracy

Expected accuracy is then:

```text
E[accuracy] = PVT × p0 + (1 - PVT) × pguess
```

where:

```text
p0 = baseline accuracy when a congruent sample is found
pguess = .50 because there are two response options
```

Substituting the voluntary-termination formula gives the model used to fit performance:

```text
E[accuracy] =
p0 - (1 - Pgroup)^((2^C × ET) / Nmaj) × (p0 - pguess)
```

In plain English:

```text
Accuracy depends on how likely the participant is to find decisive majority evidence
before the mask appears.
```

## 7. How CCC is estimated

The model tries different possible values of `C`, where `C` is the person’s cognitive control capacity in bits/sec.

For each candidate `C`, the model predicts accuracy across all task conditions. It then compares predicted accuracy with observed accuracy using a binomial likelihood function.

The estimated CCC is:

```text
E[CCC] = the value of C that best predicts the participant’s observed accuracy pattern
```

So CCC is not calculated from one trial or one condition. It is fitted from the full pattern of accuracy across different majority ratios and exposure times.

## 8. What they found

The mean estimated CCC was:

```text
3.45 bps
```

with a 95% confidence interval of approximately:

```text
3.12 to 3.70 bps
```

The range across individuals was:

```text
1.00 to 4.55 bps
```

The estimate was also reasonably reliable, with the two sessions correlating at `r = .75` and split-half reliability of `.86`. 

That is the basis of the headline claim:

```text
Cognitive control capacity is approximately 3–4 bits/sec.
```

## 9. Important interpretation

The paper’s **bits/sec** value should not be read as the brain’s total information-processing rate. It is much narrower:

> **CCC is the estimated rate at which task-relevant information can be selected and integrated under cognitive-control demand in this perceptual decision task.**

So it is not visual sensory capacity. It is not full working-memory capacity. It is a controlled evidence-throughput estimate derived from a particular task model.

This is why it is so useful for Zone Coach: it gives a clean behavioural estimate of **controlled information throughput**. But for the broader IQ Coach / problem-solving layer, it would probably need to be extended into the relational workspace measures we discussed: binding-bit steps, relation-bit steps and SR-horizon capacity.

[1]: https://www.nature.com/articles/srep34025?utm_source=chatgpt.com "The Capacity of Cognitive Control Estimated from a ..."

 ---

He, X., Qiu, B., Deng, Y., Liu, T., Chen, Y., & Zhang, W. (2022). Adaptive assessment of the capacity of cognitive control. Quarterly Journal of Experimental Psychology, 75(1), 43–52. https://doi.org/10.1177/17470218211030838 

This paper is essentially showing how to turn the original long MFT-M into a **computerised adaptive test (CAT)** for estimating CCC much more efficiently.

The original MFT-M estimates CCC from many trials across fixed combinations of **set size**, **majority ratio** and **exposure time**. The problem is that this is long: the original version used **864 trials**, about **86 minutes**. The adaptive version reduced this to **216 trials or fewer**, under **20 minutes**, while still correlating strongly with the original estimate and showing high test–retest reliability.  The SAGE abstract reports the same core result: CAT produced highly correlated scores with the original method, high reliability, and reduced administration time substantially. ([Sage Journals][1])

## Core idea

Instead of presenting all task conditions equally, the adaptive version asks:

```text
Given the person’s current estimated CCC,
which next condition will be most informative?
```

So the task does not simply get harder after correct answers. It estimates the participant’s latent CCC repeatedly, then selects the next trial condition that should best refine that estimate.

That is the important difference from a normal staircase.

```text
Simple staircase:
correct → harder
incorrect → easier

CAT-style CCC assessment:
estimate CCC → select most diagnostic condition → update CCC → repeat
```

## What they changed from the original MFT-M

The revised task, MFT-M-R, removes the easy congruent conditions:

```text
1:0
3:0
5:0
```

These conditions produce near-ceiling accuracy across most CCC levels, so they contribute little to estimating individual differences. The adaptive version keeps only the **incongruent majority-ratio conditions**:

```text
2:1
4:1
3:2
```

crossed with four exposure times:

```text
250 ms
500 ms
1000 ms
2000 ms
```

So the adaptive item pool becomes:

```text
3 ratios × 4 exposure times = 12 possible conditions
```

This makes sense because these are the conditions where accuracy actually changes as a function of CCC. The graph on page 5 shows this clearly: the congruent conditions stay near ceiling, while the incongruent conditions have sigmoidal accuracy curves that discriminate between different C values. 

## The adaptive cycle

The procedure works like this:

```text
1. Give two short baseline blocks.
2. Estimate initial CCC.
3. Calculate which condition is most informative near that CCC.
4. Present a trial from that condition.
5. Update the CCC estimate.
6. Repeat until the stopping criterion is met.
```

The flowchart on page 4 visualises this loop: initial estimate → select condition → administer trial → update E[CCC] → check stopping criterion → continue or end. 

## How the first estimate is obtained

They start with **two baseline blocks**, each containing 12 trials, covering the 12 possible condition combinations. So the initial estimate uses:

```text
2 blocks × 12 trials = 24 trials
```

They chose this because simulation work showed that after two blocks, the correlation between estimated CCC and the simulated true C value reached about **.906**, giving enough precision to start adaptive selection. 

## How the next condition is selected

For each possible condition, the model computes how much the expected accuracy would change as a function of CCC. Technically, it uses the **first derivative of expected accuracy** with respect to C.

In plain terms:

```text
The best condition is the one where a small difference in CCC
would produce the biggest difference in expected accuracy.
```

That means the selected condition is near the participant’s current threshold, where the task is neither too easy nor too hard.

The paper also adds a weighting system so the same item type is not repeatedly selected. Instead of always choosing the single most informative condition deterministically, each condition is chosen probabilistically in proportion to its informativeness. This improves robustness and avoids over-sampling one narrow condition.

## Stopping rule

They used a maximum of:

```text
216 trials
```

but also examined stopping earlier when the standard error of the CCC estimate became small enough.

For example, using:

```text
SE(CCC) < .03
```

gave an average of roughly:

```text
125–128 trials
```

while still correlating around:

```text
r ≈ .72
```

with the original MFT-M estimate. 

So there is a trade-off:

| Stopping rule   | Approximate result                         |
| --------------- | ------------------------------------------ |
| Full 216 trials | Highest correspondence with original MFT-M |
| SE < .03        | Much shorter, still useful                 |
| SE < .08 or .09 | Very short, but weaker correspondence      |

For research-grade estimates, 216 trials or a stricter SE threshold is safer. For app use, a looser threshold may be acceptable if repeated over sessions.

## Main validation results

The adaptive version worked well:

```text
MFT-M-R Session 1 correlated with original MFT-M:
r = .781

MFT-M-R Session 2 correlated with original MFT-M:
r = .813

Test–retest reliability across MFT-M-R sessions:
r = .862
```

That is the key result. The adaptive task preserved much of the information in the original task while using far fewer trials. 

## Why this matters for the WM–CCC / Zone Coach design

This method gives you a direct template:

```text
Do not present all possible task conditions equally.
Estimate the user’s current capacity.
Select the next condition that best tests the current uncertainty band.
Update after each trial or mini-block.
Stop when the estimate stabilises.
```

For Zone Coach, that means the 3-minute version could use a very lightweight version of CAT:

```text
brief calibration
→ adaptive majority-ratio / exposure-time selection
→ provisional CCC / cognitive bandwidth estimate
```

For the WM–CCC game, the same logic can extend beyond speed and discrimination:

```text
estimate C-Control
estimate A-Bind
estimate R-Bind
estimate S-Horizon
select the next condition that is most informative for the weakest or most uncertain parameter
```

So the adaptive system could eventually select across:

```text
exposure time
majority ratio
orientation discrimination gap
spatial-frequency discrimination gap
n-back level
binding load
relational transformation load
lure pressure
```

## Bottom line

The efficient adaptation method is:

> **Use CAT-style adaptive trial selection to estimate CCC from the most informative subset of MFT-M conditions, rather than administering every condition equally.**

It works by removing low-information ceiling conditions, estimating CCC after a short baseline, selecting near-threshold conditions using the expected accuracy function, updating CCC after each response, and stopping when enough precision is reached.

For Trident-G, this is highly useful because it gives a measurement architecture for keeping the learner near the **trainable threshold zone** rather than simply increasing difficulty mechanically.

[1]: https://journals.sagepub.com/doi/10.1177/17470218211030838?utm_source=chatgpt.com "Adaptive assessment of the capacity of cognitive control"

 
 ---
 
 Zhang, H., Fan, S., Yang, J., Yi, J., Guan, L., He, H., Zhang, X., Luo, Y., & Guan, Q. (2024). Attention control training and transfer effects on cognitive tasks. Neuropsychologia, 200, Article 108910. https://doi.org/10.1016/j.neuropsychologia.2024.108910


The results fit the theory fir  **selective broad transfer**, not yet strong “far transfer to intelligence” in the hard sense.

The study trained healthy young adults for **7 days** on the MFT-M, about **46 minutes per day**, against an active sham condition. The MFT-M group showed an increase in daily CCC from about **3.77 bps to 4.12 bps**, plus transfer effects to some attention-control, working-memory ERP, task-switching ERP and verbal-learning measures.  The published abstract also summarises the key point: MFT-M training showed a “broad transfer scope”, but the transfer depended on the form of the training task. ([PubMed][1])

## What the results actually show

| Result type                       | What improved                                              | Interpretation                                                                  |
| --------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------- |
| **Training gain**                 | CCC increased across the 7 days                            | The MFT-M can be trained, at least over short periods                           |
| **Behavioural transfer**          | Some ANT-R congruent / double-congruent conditions         | Transfer was strongest where task form overlapped with MFT-M                    |
| **Verbal learning**               | AVLT learning trials improved                              | Possibly better sustained attention / encoding, not necessarily memory capacity |
| **Neural transfer**               | 2-back P2 decrease and P3 increase                         | Lower attentional demand / improved neural efficiency during WM load            |
| **Neural transfer**               | Task-switching repeat-condition P3 increase                | Better attention allocation in stable/repeat conditions                         |
| **No clear behavioural transfer** | N-back behaviour, digit span, switch cost, Stroop, fluency | MFT-M alone did not broadly improve all executive functions                     |

So the transfer is real but patterned. It is not “everything improved”. It is:

```text
attention-control training
→ better performance where attentional selection overlaps
→ neural efficiency changes in WM and task repeat conditions
→ limited behavioural transfer where additional operations are required
```

That is exactly what the Trident-G/PS-RWC distinction would predict.

## Why this supports the Trident-G interpretation

The MFT-M trains something like:

```text
controlled evidence extraction
+ majority sampling
+ attentional allocation
+ uncertainty reduction
+ speeded perceptual decision control
```

It does **not** strongly train:

```text
arbitrary binding
relational transformation tracking
successor-horizon prediction
task-rule switching
explicit meta-epistemic control
problem-space search
```

So the results make sense. MFT-M training improved CCC and transferred most clearly to tasks sharing **attention-control and perceptual-selection structure**, but it did not produce robust behavioural gains in N-back or switching because those tasks require additional operations beyond evidence sampling. The authors make a similar point when explaining that the 2-back task also requires updating, maintenance and inhibition, so attentional neural changes may not be sufficient to produce behavioural changes. 

## The key result for the theory: neural transfer without behavioural transfer

The 2-back result is especially important.

Behaviourally, the MFT-M group did not clearly outperform controls on N-back. But neurally, they showed:

```text
P2 decrease
+ P3 increase
```

in the 2-back task. The authors interpret this as improved neural efficiency in attentional processing during working-memory demand. 

In the framework, this suggests:

```text
MFT-M training improved the attention-control substrate,
but did not fully train the relational workspace operations needed for behavioural WM gains.
```

That is a very strong argument for extending the task into the **WM–CCC / PS-RWC** version we discussed.

The original MFT-M appears to train the lower layer:

```text
C-Control / evidence bandwidth
```

but the proposed Gabor n-back variant would add:

```text
A-Bind  = arbitrary association binding
R-Bind  = relational transformation binding
S-Horizon = successor/path horizon
I-Control = lure suppression
```

That should, in principle, target the missing operations that ordinary MFT-M does not directly train.

## Why the ANT-R transfer was form-constrained

The behavioural ANT-R improvements were mainly in **congruent** or **double-congruent** conditions, not in the incongruent conflict conditions. The authors suggest that MFT-M may encourage a grouping/scanning strategy that helps when arrows align, but may not help — and may even interfere — when the task requires ignoring flankers or spatial-location conflict. 

That is almost a textbook example of the distinction between:

```text
surface improvement / fast Gc
vs
wrapper-invariant transfer / slow schematic Gc
```

The learner may have improved a surface-compatible policy:

```text
scan arrow field
group directions
respond to dominant direction
```

but that policy does not automatically become:

```text
identify the task-relevant variable
suppress misleading surface cues
recover invariant rule under conflict
```

So the result supports the claim that **wrapper swaps and breakpoint perturbations are necessary**. Without them, the training may compile a useful but partly brittle surface strategy.

## How this relates to form-route and function-route theory

This study explicitly uses the **form-route / function-route** distinction. Ericson and Klingberg’s dual-process model argues that training effects can arise through a fast form-specific route or a slower, more general function route. ([Nature][2]) The MFT-M training results fit that distinction well: some transfer appears form-driven, while the ERP changes suggest some function-level attentional change.

the Trident-G version is more detailed:

```text
form-route
≈ fast Gc / surface strategy compilation

function-route
≈ attention-control substrate improvement

far transfer
≈ relational invariant recovery + vertical control-policy deployment + delayed/niche validation
```

So I would say this paper provides good support for the **lower half** of the Trident-G transfer stack, but not yet the full stack.

## Why this does not overturn the sceptical WM-training literature

The broader literature remains cautious. A major meta-analysis concluded that WM training does not reliably improve intelligence or other far-transfer outcomes, although near and intermediate transfer effects are often seen. ([PubMed][3]) Reviews of WM training also distinguish true capacity change from improved task skill, strategy use and efficiency. ([PubMed][4])

This MFT-M paper is interesting because it is not simply standard WM training. It targets attention control under uncertainty. But the same caution applies: the evidence is not yet “MFT-M raises g”. It is closer to:

> MFT-M training may improve controlled attentional allocation and produce selective transfer to tasks sharing attention-control demands, with some neural evidence of improved efficiency in working-memory and task-repeat contexts.

That is useful, but it is not yet full far transfer.

## What the results imply for the WM–CCC game

The paper strongly supports the idea that the training should **not stop at straight MFT-M / CCC**.

A good next-generation design would use MFT-M as the entry layer:

```text
MFT-M / Gabor majority block
→ trains controlled evidence extraction and cognitive bandwidth
```

Then add the missing layers:

```text
n-back state tracking
→ trains temporal maintenance

arbitrary feature binding
→ trains episodic-style binding

relational change tracking
→ trains transformation use

successor/path prediction
→ trains SR-style horizon control

wrapper swaps
→ test invariant recovery

meta-epistemic prompts
→ global-workspace control handle

puzzle transfer
→ problem-space application
```

This is exactly where the uploaded results become useful: they show that MFT-M can shift the attentional substrate, but also show the limits of that substrate alone.

## Bottom line

These results are encouraging, but they also show why the expanded theory is needed.

The study suggests:

```text
MFT-M training can improve CCC
and produce selective transfer to attention-related tasks
and neural efficiency changes in WM/task-repeat conditions.
```

But it also suggests:

```text
MFT-M alone does not robustly train all WM, shifting or problem-solving operations.
```

So the Trident-G interpretation would be:

> **Straight MFT-M trains the state/evidence-control layer. To get stronger far transfer, it needs to be extended into relational workspace training, wrapper perturbation, meta-epistemic prompting and puzzle/problem-space deployment.**

That is a very good justification for the WM–CCC → PS-RWC → puzzle/meta-epistemic progression.

---

Wu, X., Geng, Y., Chen, Y., Zhang, S., Liu, T., You, S., Liu, F., Jiang, Y., Wang, Q., & Wu, T. (2026). When more control means better choices: Cognitive control networks drive expected-value maximization under uncertainty. NeuroImage, 335, Article 121989. https://doi.org/10.1016/j.neuroimage.2026.121989

 **As an explanatory framework, the theory fits these results very well**,  It is an individual-differences/fMRI study comparing high-CCC and low-CCC participants. So it does not prove that training WM–CCC or PS-RWC will produce the same effects, but it gives a very good mechanistic target for what successful training should change.

## Core interpretation

The uploaded study found that high-CCC individuals made more expected-value-maximising choices under uncertainty, showed higher decision thresholds, and were better able to resist probability matching. The authors interpret this as high CCC enabling people to allocate control resources to override heuristic responding. 

Our theory explains this as follows:

```text
CCC / cognitive bandwidth
→ better controlled evidence extraction

PS-RWC / relational workspace capacity
→ better maintenance of the task-relevant decision relation

meta-epistemic control
→ better global-workspace access to the rule: “choose the higher expected-value option”

CON–FPN coordination
→ better mobilisation of control when uncertainty rises

result
→ higher decision threshold, less probability matching, more expected-value maximisation
```

So the high-CCC group may not simply be “faster” or “more intelligent” in a vague way. They may be better at keeping the relevant relational control policy active:

```text
current probability relation
→ higher probability option
→ suppress tempting lower-probability exploration
→ commit only when evidence threshold is met
```

## Why this maps onto training

The study’s decision task requires more than perceptual speed. It requires the participant to hold a stable decision policy across changing uncertainty levels. That is very close to what we are calling **operational relational workspace capacity**.

The key result is that high-CCC participants maintained higher decision thresholds. In our language:

```text
they did not simply process more evidence;
they sustained a stricter control policy under uncertainty.
```

This is exactly the kind of thing the WM–CCC → PS-RWC → puzzle/prompt sequence is designed to train.

## What the theory explains in the results

| Result in the paper                                   | Trident-G / PS-RWC interpretation                                                   |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------- |
| High-CCC participants had higher PMR                  | Better maintenance of the expected-value relation under uncertainty                 |
| PMR dropped as uncertainty increased                  | As entropy rises, the relation becomes harder to stabilise                          |
| Low-CCC participants showed larger RT costs           | More effortful or less efficient state–policy coordination                          |
| High-CCC participants used higher decision thresholds | More cautious evidence accumulation and stronger inhibition of heuristic responding |
| Starting bias still favoured the suboptimal option    | Probability matching remains a default attractor, not removed by capacity alone     |
| INS–MFG connectivity moderated CCC → PMR              | Capacity only helps when uncertainty signals are routed into executive control      |

That last point is especially important. The study found that high CCC predicted higher PMR only when anterior insula–middle frontal gyrus connectivity was strong. In other words, having capacity was not enough; the system had to **mobilise** that capacity at the right moment. 

That maps almost directly onto the distinction:

```text
capacity
≠ deployment

workspace ability
≠ transfer

trained relation
≠ niche-coupled policy
```

## Why ordinary WM training often fails

This also helps explain why ordinary working-memory training often gives weak far-transfer results. Meta-analytic evidence suggests WM training can improve trained and near-WM tasks, but does not reliably improve broad intelligence or far-transfer outcomes when compared with active controls. ([PubMed][1])

Our interpretation would be:

```text
ordinary WM training improves task skill or local updating;
but decision-making transfer requires a deployable control policy.
```

So the missing pieces are likely:

```text
relational binding
successor-style mapping
heuristic suppression
meta-epistemic prompting
wrapper transfer
niche cue activation
delayed reuse
```

This aligns with the protocol document’s claim that WM is not enough by itself; it must be embedded in a stack involving WM/SR operator training, prompts, wrapper swaps, implementation intentions and delayed re-checks. 

## The stronger training hypothesis

The theory would predict that a successful WM–CCC / PS-RWC training programme should not merely increase n-back level or speed. It should shift people’s decision profile in specific ways:

```text
1. Higher effective relational throughput
   More relation-bits maintained and used under time pressure.

2. Better threshold control
   More evidence before committing when control is worthwhile.

3. Lower lure capture
   Fewer recent-but-wrong or tempting-but-invalid responses.

4. Better uncertainty routing
   More appropriate control recruitment when uncertainty increases.

5. Lower wrapper-swap cost
   Faster recovery when the surface form changes.

6. Better delayed reuse
   The same control policy returns after sleep/delay.
```

In a decision-making study, this would show up as:

```text
higher PMR
lower probability matching
more adaptive decision thresholds
less RT cost under uncertainty
better recovery after changed probability structures
possibly stronger coupling between uncertainty detection and executive control
```

## The most useful prediction

The most interesting prediction is not simply:

```text
training raises CCC
```

It is:

```text
training improves the conversion of capacity into policy use.
```

That is exactly what the INS–MFG result suggests: capacity becomes useful when uncertainty/salience signals can trigger executive deployment. The Trident-G training stack would aim to improve that conversion by linking:

```text
state readiness
→ attention-control bandwidth
→ relational workspace
→ explicit prompt
→ decision policy
→ feedback
→ delayed reuse
```

## Bottom line

The Trident G theory could explain these results very well.

The uploaded study suggests that better cognitive-control capacity supports optimal decision-making because it helps people sustain cautious, goal-consistent evidence thresholds and resist probability matching. the expanded theory adds the missing training logic: to produce transferable improvement, training should not just increase perceptual bits/sec, but build a **relational workspace control policy** that can be mobilised under uncertainty, linked to prompts, and reused across changed wrappers and real-world niches.

The careful claim would be:

> **The CCC decision-making findings are consistent with the Trident-G / PS-RWC theory: better controlled evidence throughput matters, but its behavioural value depends on whether the person can bind, sustain and deploy the relevant relational control policy under uncertainty.**


---

# Relational Processing

Yes. There is a coherent literature trail from **working memory as temporary binding**, through **relational complexity**, into **fluid intelligence as relation processing**. That gives a strong theoretical basis for defining the construct as **Relational Workspace Capacity** rather than simply “n-back ability” or generic “WM capacity”.

## 1. Working memory as bindings and relations, not just items

The classic simple-span framing asks: *how many items can be held?* But a more useful tradition asks: *how many relations among items, features, positions, contexts, or transformations can be held and processed?*

Halford, Wilson, and Phillips’ relational-complexity theory is central here. They argue that processing capacity is best defined by the **complexity of relations processed in parallel**, where complexity increases with the number of related dimensions or arguments: unary, binary, ternary, quaternary, etc. Their review links relational complexity to load in reasoning and sentence comprehension, developmental change, and comparative cognition. ([Cambridge University Press & Assessment][1])

Oberauer’s binding account is even closer to the proposed measure. In *Working Memory Capacity Limits Memory for Bindings*, he argues that WM capacity specifically limits the maintenance of **temporary bindings**, not merely memory for items. In his experiments, increasing set size impaired binding memory much more than item memory, and the errors were largely binding confusions within the current memory set. ([Journal of Cognition][2]) He explicitly links this to building new structural representations, stating that temporary bindings are needed for reasoning and language comprehension, and that WM capacity limits the complexity of new relational representations. ([Journal of Cognition][2])

Oberauer and colleagues’ broader individual-differences work supports the same direction. In *Which working memory functions predict intelligence?*, they argue that typical WM tasks require short-term maintenance of elements **and relations between elements**, such as word–position or digit–location bindings. They conclude that their results are better explained by theories of WM as a system for building relational representations through temporary bindings than by a simple storage-plus-processing account. ([Psychologisches Institut UZH][3])

So the first literature strand supports this formulation:

> **WMC is not just the number of items held. It is partly the capacity to establish, maintain, update and protect temporary bindings among representational elements.**

## 2. Hippocampal-episodic continuity: binding across space and time

The hippocampal literature strengthens the relational interpretation. Olsen, Moses, Riggs, and Ryan review evidence that the hippocampus is not only involved in long-term recognition memory, but also in relational binding and comparison across short delays and perceptual tasks. They argue that the hippocampus binds disparate elements across space and time and compares externally presented information with internally maintained or stored relational representations. ([Frontiers][4])

This matters for the construct because arbitrary association binding in the Gabor task:

```text
orientation ↔ spatial frequency
orientation ↔ luminance
flow type ↔ speed
```

is structurally similar to episodic binding: “what went with what, in which context, at which moment?”

The successor-representation literature then adds the predictive-map extension. Stachenfeld, Botvinick, and Gershman argue that hippocampal representations can be understood as predictive maps, representing each state partly in terms of its likely successor states. Their account explicitly frames the hippocampus as encoding predictions of future states rather than merely current states.  Ekman, Kusch, and de Lange provide human evidence that visual and hippocampal cortex can form successor-like predictive maps after visual sequence learning. ([eLife][5])

So the second strand supports two subcomponents of the task:

```text
Arbitrary Associative Binding
= what belongs with what?

Relational / SR Binding
= what state-change or future-state relation follows from this state?
```

That gives a principled bridge from episodic feature binding to predictive relational mapping.

## 3. Continuity with fluid intelligence: Gf as relational processing

The same relational logic appears in the fluid intelligence literature. Kyllonen and Christal’s influential paper framed reasoning ability as very closely related to working-memory capacity. ([ETS][6]) Süß, Oberauer, Wittmann, Wilhelm, and Schulze found that a broad battery of WM tasks was highly related to general intelligence and reasoning ability. ([ZORA][7])

However, the more precise modern interpretation is not simply “WM causes Gf”. Shipstead, Harrison, and Engle argue that the WMC–Gf relation should not be reduced to passive maintenance. They emphasise that problem solving requires representing a problem stably, testing hypotheses, and disengaging from outdated representations when they fail. ([Engle Lab][8]) That fits the Trident-G emphasis on stability plus flexible re-entry.

Chuderski’s relational-integration work is particularly important. The Relational Integration Task was designed to measure the ability to bind mental representations into more complex relational structures, and it predicted fluid reasoning above other WM tasks. ([PMC][9]) Jastrzębski, Ociepka, and Chuderski go even further: using three relation-processing tasks and three hallmark Gf tests, they found that the relation-processing factor was statistically equivalent to the Gf factor, and that much of their shared residual variance remained after controlling for WMC. ([ScienceDirect][10])

This supports the core continuity claim:

> **Working memory capacity and fluid reasoning meet at relational binding and relational validation. WMC supplies the temporary workspace for binding and maintaining relations; Gf expresses the ability to use, validate, transform and generalise those relations under novel demands.**

## 4. Implication for the construct: Relational Workspace Capacity

the proposed construct sits cleanly between WMC and Gf:

```text
Relational Workspace Capacity
=
the amount of structured relational information
that can be extracted, bound, maintained, updated, compared and protected
over short temporal horizons.
```

This is not merely item memory. It is not merely n-back level. It is closer to:

```text
feature extraction
→ temporary binding
→ relation maintenance
→ transformation tracking
→ lure suppression
→ successor/path prediction
```

That gives continuity between:

| Level                          | Construct                              | the task analogue                    |
| ------------------------------ | -------------------------------------- | ------------------------------------- |
| Controlled evidence extraction | CCC / perceptual control               | Majority Gabor MFT-M block            |
| Temporary binding              | WMC as bindings                        | θ↔F, θ↔L, F↔L associations            |
| Relational complexity          | n-tuple processing                     | binary / ternary feature relations    |
| Relational integration         | Gf-relevant structure building         | same-change / transformation tracking |
| Predictive mapping             | SR-style state transitions             | successor/path horizon mode           |
| Problem solving                | relational reasoning under constraints | later puzzle + prompt layer           |

## 5. How this maps onto the Gabor majority-function n-back

A classic n-back task usually asks:

```text
item identity
→ hold over n steps
→ compare current item with item n trials back
```

the Gabor task instead asks:

```text
presemantic feature field
→ extract majority state
→ bind feature dimensions
→ maintain relation across time
→ compare current relation with prior relation
→ resist lure states
→ predict or validate successor states
```

So the two core measures are well justified:

### 1. Arbitrary Associative Binding Capacity

This captures temporary, episodic-style binding:

```text
Can the user bind feature A with feature B across time?
```

Example:

```text
Was this majority orientation previously paired with this spatial frequency?
```

A simple information demand could be:

```text
H_binding = log2(|θ| × |F|)
binding load = H_binding × n
```

This is directly aligned with the temporary-binding tradition in WMC.

### 2. Relational / SR Binding Capacity

This captures transformation and predictive structure:

```text
Can the user track how one state changes into another?
Can the user predict or validate what follows?
```

Example:

```text
Did the majority orientation change in the same way as before?
Can this state still lead to the target state?
```

This is closer to relational integration, fluid reasoning, and SR-style predictive mapping.

## 6. Theoretical payoff

The construct is attractive because it avoids two weak framings:

```text
weak framing 1:
n-back level = intelligence

weak framing 2:
CCC bits/sec = full cognitive capacity
```

A stronger framing is:

> **CCC measures controlled evidence throughput. Relational Workspace Capacity measures how much relational structure can be kept operational once evidence has been extracted.**

That gives a cleaner behavioural bridge to Gf:

```text
CCC
= rate of controlled evidence extraction

RWC
= amount of bound relational structure maintained over time

Gf / relational reasoning
= flexible validation, transformation and transfer of that structure
```

## 7. Key references

Halford, G. S., Wilson, W. H., & Phillips, S. (1998). Processing capacity defined by relational complexity: Implications for comparative, developmental, and cognitive psychology. *Behavioral and Brain Sciences, 21*(6), 803–831. [https://doi.org/10.1017/S0140525X98001769](https://doi.org/10.1017/S0140525X98001769)

Oberauer, K. (2019). Working memory capacity limits memory for bindings. *Journal of Cognition, 2*(1), Article 40. [https://doi.org/10.5334/joc.86](https://doi.org/10.5334/joc.86)

Oberauer, K., Süß, H.-M., Wilhelm, O., & Sander, N. (2008). Which working memory functions predict intelligence? *Intelligence, 36*(6), 641–652. [https://doi.org/10.1016/j.intell.2008.01.007](https://doi.org/10.1016/j.intell.2008.01.007)

Süß, H.-M., Oberauer, K., Wittmann, W. W., Wilhelm, O., & Schulze, R. (2002). Working-memory capacity explains reasoning ability—and a little bit more. *Intelligence, 30*(3), 261–288. [https://doi.org/10.1016/S0160-2896(01)00100-3](https://doi.org/10.1016/S0160-2896%2801%2900100-3)

Kyllonen, P. C., & Christal, R. E. (1990). Reasoning ability is (little more than) working-memory capacity?! *Intelligence, 14*(4), 389–433. [https://doi.org/10.1016/S0160-2896(05)80012-1](https://doi.org/10.1016/S0160-2896%2805%2980012-1)

Chuderski, A. (2014). The relational integration task explains fluid reasoning above and beyond other working memory tasks. *Memory & Cognition, 42*(3), 448–463. [https://doi.org/10.3758/s13421-013-0366-x](https://doi.org/10.3758/s13421-013-0366-x)

Jastrzębski, J., Ociepka, M., & Chuderski, A. (2020). Fluid reasoning is equivalent to relation processing. *Intelligence, 82*, Article 101489. [https://doi.org/10.1016/j.intell.2020.101489](https://doi.org/10.1016/j.intell.2020.101489)

Olsen, R. K., Moses, S. N., Riggs, L., & Ryan, J. D. (2012). The hippocampus supports multiple cognitive processes through relational binding and comparison. *Frontiers in Human Neuroscience, 6*, Article 146. [https://doi.org/10.3389/fnhum.2012.00146](https://doi.org/10.3389/fnhum.2012.00146)

Stachenfeld, K. L., Botvinick, M. M., & Gershman, S. J. (2017). The hippocampus as a predictive map. *Nature Neuroscience, 20*(11), 1643–1653. [https://doi.org/10.1038/nn.4650](https://doi.org/10.1038/nn.4650)

Ekman, M., Kusch, S., & de Lange, F. P. (2023). Successor-like representation guides the prediction of future events in human visual cortex and hippocampus. *eLife, 12*, Article e78904. [https://doi.org/10.7554/eLife.78904](https://doi.org/10.7554/eLife.78904)

---

# Optic Flow SRs

There is **good indirect evidence** that optic-flow variables can feed into SR-like predictive/state-transition representations, especially in navigation. There is **not yet strong direct evidence** that “optic-flow type” representations themselves are encoded as formal successor representations in humans. The stronger claim is:

> **Optic flow provides action-linked state-transition evidence that can be integrated into predictive spatial/cognitive maps. Those maps can be SR-like, but the optic-flow signal is probably an input to, or wrapper for, SR construction rather than the SR itself.**

## 1. Evidence for optic-flow representations

There is good evidence that the human visual system represents global optic-flow structure. Human motion areas such as MT/MST and related dorsal-stream regions show sensitivity to radial motion, focus of expansion, heading direction and complex flow patterns, which makes optic flow a plausible stimulus family for dynamic “state-change” tasks. ([PMC][1])

This supports the wrapper idea: optic flow is not just “moving dots”. It has representational structure over variables such as:

```text
expansion / contraction
rotation
translation
heading direction
focus of expansion
speed
coherence
```

So it can be treated as a dynamic analogue of Gabor orientation / spacing / luminance.

## 2. Evidence for SR-like visual predictive maps

There is direct human evidence that visual and hippocampal cortex can develop **successor-like representations** for learned visual sequences. Ekman and colleagues found that after participants learned arbitrary spatiotemporal sequences, presenting a single item evoked representations biased toward future sequence items, not merely the current or past item. Their interpretation is explicitly SR-like: visual and hippocampal cortex represented a predictive map of the visual world. ([eLife][2])

That matters for the task because it shows that SR-like structure is not restricted to literal spatial navigation. It can emerge over learned **visual event sequences**. An optic-flow sequence such as:

```text
outward spiral → faster outward spiral → rotation-dominant flow → contraction
```

could, in principle, be used as a perceptual event sequence for successor-like prediction.

## 3. Evidence that optic flow supports human navigation and spatial problem solving

There is good evidence that humans use optic flow in navigation tasks that require more than passive perception. Kirschen and colleagues found that optic flow helped participants learn synthetic environments, reduced disorientation and backtracking in virtual mazes, and helped participants locate remembered target positions more accurately in a virtual city-block environment. Their abstract explicitly links optic flow to wayfinding and path integration, which involves updating a mental representation of place from travelled paths. ([memory.psych.upenn.edu][3])

A more recent naturalistic VR study found that humans and monkeys navigated to a remembered location by integrating optic flow generated by their own joystick movements. The researchers manipulated optic-flow perturbations, joystick gain and optic-flow density, and concluded that participants relied heavily on optic flow in a closed-loop navigation task. ([Journal of Neuroscience][4])

So for **spatial problem solving**, the evidence is strong enough to say:

> **Optic flow supports human path integration, route learning, remembered-goal navigation and closed-loop sensory evidence accumulation.**

That is problem solving in the spatial/navigation sense: the user must maintain a goal, update self-motion evidence, choose actions and correct trajectory.

## 4. Evidence for predictive hippocampal/prefrontal maps in human navigation

There is also evidence that human navigation uses predictive representations in hippocampal and prefrontal systems. Brunec and colleagues argue for multiscale predictive representations guiding naturalistic navigation, organised along posterior–anterior axes in hippocampal and prefrontal cortex. ([PMC][5])

The hippocampal SR theory itself claims that the hippocampus represents current states partly in terms of anticipated future states, providing a compact summary of likely future occupancy rather than only representing the current location. ([Google DeepMind][6])

This is the link you want:

```text
optic flow
→ self-motion / heading evidence
→ path integration
→ predictive map of reachable states
→ SR-like navigation representation
```

## 5. The cautious interpretation

I would not yet say:

```text
optic flow is encoded as a successor representation
```

That is too strong.

I would say:

> **Optic-flow variables are plausible dynamic state variables for building or probing successor-like predictive maps, especially in navigation-like tasks.**

Or, for the app spec:

> **The optic-flow wrapper tests whether relational workspace training transfers from static feature-state transitions to dynamic motion-state transitions. It is SR-inspired because the user tracks how current motion states predict or constrain future motion states.**

## 6. Relevance to the task

This gives a good rationale for an optic-flow horizontal wrapper.

The Gabor version trains:

```text
static feature state
→ feature binding
→ transformation relation
→ successor-like prediction
```

The optic-flow version would train:

```text
dynamic motion state
→ flow/speed/heading binding
→ motion transformation
→ path-like successor prediction
```

A clean experimental progression would be:

```text
Gabor relation learned:
orientation change + spacing change

Horizontal wrapper:
optic-flow angle change + speed change

Transfer question:
Can the same relation-tracking operation survive the shift from static visual pattern to dynamic motion flow?
```

That fits the attached Trident-G principle that horizontal transfer tests whether the same invariant survives changed wrappers, while vertical transfer connects state, attention, WM/SR inference, prompts, action and delayed reuse.  The Seeing Patterns spec already frames Motion Flow as a later lane for testing the same relation across visual and motion variants, while warning that motion flow should remain experimental until device timing and optic-flow parameters are validated. 

So overall there is a good evidence base for using optic flow as a **horizontal wrapper** and as a **dynamic SR-inspired state-transition task**.

The strongest defensible statement is:

> **Optic flow is used by humans for path integration, remembered-goal navigation and closed-loop sensory evidence accumulation, and human visual/hippocampal systems can form successor-like predictive maps over visual sequences. Therefore, optic-flow majority and n-back variants are a plausible way to test whether relational workspace operations transfer from static Gabor features to dynamic motion-state transitions.**

The gap to validate is whether the specific optic-flow R-WMC task predicts problem solving, navigation-style planning, or later puzzle-transfer outcomes better than the Gabor version alone.

---

# Dorsal and Ventral Streams & Training Transfer

A testable transfer hypothesis, not as an established fact. The evidence supports this chain:

```text
static form-feature wrapper
+ dynamic motion/optic-flow wrapper
→ partially distinct visual streams
→ convergence through retrosplenial, parahippocampal and hippocampal systems
→ possible abstraction of shared relational structure
→ potential cross-wrapper transfer if the trained invariant is not surface-bound
```

## 1. Gabor and optic-flow wrappers plausibly emphasise different visual streams

The Gabor-patch version mainly uses **static visual feature variables**: orientation, spatial frequency and contrast/luminance. These are canonical early visual features and are often used to probe orientation-selective and spatial-frequency-sensitive processing in early visual cortex and downstream visual areas. Orientation-specific adaptation work, for example, shows orientation-sensitive effects across human visual cortex beyond V1, including V2/V3/V4. ([PMC][1])

The optic-flow version would shift the task surface towards **dynamic dorsal-stream/self-motion variables**: global motion direction, expansion/contraction, rotation, heading, speed and coherence. A 2024 neuroimaging meta-analysis describes optic flow as structured retinal motion generated by self-motion and notes that it is central for monitoring direction and velocity of movement during navigation. It also identifies optic-flow sensitivity in MT+, V6/V6A, V3A/pIPS, cingulate sulcus visual regions, posterior cingulate/precuneus and related dorsal motion/navigation regions. ([Iris][2])

So the wrapper contrast is meaningful:

```text
Gabor wrapper
= static feature extraction / form-feature majority

Optic-flow wrapper
= dynamic motion-state extraction / self-motion majority
```

But Gabor is not “pure ventral”, and optic flow is not “pure dorsal”. Both begin from early visual processing and both can engage attention, grouping, decision and memory systems. The useful point is not a hard anatomical split; it is that they stress **different perceptual surfaces** while potentially preserving the same abstract operation.

## 2. Dorsal and ventral streams converge on MTL/hippocampal systems

There is strong anatomical and systems-level support for convergence. Nau, Julian and Doeller explicitly argue that the dorsal and ventral visual streams, although classically distinct, both converge on the medial temporal lobe in the primate brain. Their review states that the dorsal occipitoparietal stream is well suited to provide the MTL with gaze- and self-motion information, while the ventral stream supplies object-quality and feature information; they then describe the MTL as a convergence zone for visual information. ([DoellerLab][3])

More specifically, the same review places posterior parietal cortex, retrosplenial cortex and hippocampal formation in a pathway that transforms self-centred coordinates into world-centred coordinates during navigation. Posterior parietal cortex is described as mainly processing self-centred/body-based information, retrosplenial cortex as a key transformation stage, and the hippocampal formation as encoding world-centred information. ([DoellerLab][3])

Recent connectivity work strengthens this. Rolls and colleagues report a ventromedial visual “where” stream from early visual cortex through retrosplenial/ventromedial visual regions to medial parahippocampal regions and then hippocampus during scene memory. They also note effective connectivity from motion-sensitive MT/MST-related regions into ventromedial visual regions, and onward connectivity from medial parahippocampal cortex to hippocampus. ([Nature][4])

That supports your convergence claim:

```text
static/form-feature information
and
dynamic/self-motion information
can both reach parahippocampal–hippocampal systems,
where relational, spatial and episodic structure can be bound.
```

## 3. Optic flow links naturally to navigation, spatial updating and egocentric state transitions

The optic-flow evidence is especially relevant because optic flow is not merely a low-level motion signal. The 2024 ALE meta-analysis found that optic-flow processing shares activation with **egocentric navigation**, especially in anterior precuneus, suggesting that optic flow provides self-motion information for egocentric navigation. It also reports partial segregation into dorsal and ventromedial networks, with optic flow tending to activate more dorsal motion regions and spatial navigation tending to activate more ventral/hippocampal/parahippocampal regions. ([Iris][2])

The same meta-analysis concludes that optic-flow and egocentric navigation share common activation in anterior precuneus, while optic flow and allocentric map-like navigation do not show the same overlap. It interprets anterior precuneus as a hub for transforming egomotion-relevant visual information into egocentric representations useful for navigation, and notes that optic flow has a dominant role in signalling changes in direction and location for spatial updating. ([Iris][2])

This is directly useful for your task design. An optic-flow majority task can be treated as a dynamic state-transition wrapper:

```text
current motion state
→ change in heading / expansion / rotation / speed
→ updated egocentric state
→ possible next state
```

That is closer to SR-style transition learning than a purely static feature task.

## 4. Hippocampal/parahippocampal systems are plausible sites for shared relational abstraction

The hippocampal system is not simply a visual endpoint. It is well placed to bind variables into relational event structures. Nau et al. explicitly describe the MTL as a convergence zone and emphasise strong interactions between visual and mediotemporal systems, putting the hippocampal formation in a position to shape vision and guide behaviour. ([DoellerLab][3])

The SR/predictive-map literature then gives the computational form. Stachenfeld, Botvinick and Gershman argue that the hippocampus can learn a predictive map in which each state is represented in terms of its successor states, supporting future-state prediction, reward prediction and generalisation beyond purely geometric maps. ([Gershman Lab][5]) Human sequence-learning evidence also shows that visual and hippocampal cortex can form successor-like predictive maps of future visual events, not merely encode current stimuli. ([PMC][6])

So the strongest neural-computational formulation is:

```text
Gabor task:
static feature state → feature relation → transition relation

Optic-flow task:
motion state → self-motion relation → transition relation

Shared abstraction:
state → change → next reachable state
```

This makes cross-wrapper transfer plausible if the participant is learning the **relation schema**, not just the perceptual signature.

## 5. Why transfer between Gabor and optic flow is plausible but not guaranteed

The evidence supports a graded prediction.

A weakly trained learner may simply learn:

```text
“spot the majority orientation in Gabor patches”
```

That probably will not transfer well to optic flow.

A more deeply trained learner may learn:

```text
extract the relevant variable
bind it to another variable
track the transformation
ignore lures
predict the next state
```

That should be more likely to transfer from Gabor to optic flow, because the wrapper has changed but the relational operation is preserved.

This is exactly where the Gabor–optic-flow contrast becomes useful as a **horizontal transfer probe**:

| Training layer      | Gabor wrapper                        | Optic-flow wrapper                          | Shared invariant             |
| ------------------- | ------------------------------------ | ------------------------------------------- | ---------------------------- |
| Majority extraction | majority orientation / spacing       | majority expansion / rotation / translation | dominant variable extraction |
| Discrimination      | orientation or spatial-frequency gap | coherence / speed / heading gap             | variable precision           |
| Binding             | orientation ↔ spacing                | flow type ↔ speed / heading                 | temporary feature binding    |
| Transformation      | Δorientation / Δspacing              | Δheading / Δspeed / flow reversal           | relation-over-change         |
| SR/path             | next Gabor state                     | next motion/heading state                   | successor prediction         |

## 6. The best claim boundary

I would not claim:

```text
Training Gabor relational WM will definitely transfer to optic flow.
```

Nor:

```text
Both tasks directly measure hippocampal SR.
```

The defensible claim is:

> **Because dorsal motion/self-motion and ventral/static-feature information both converge through retrosplenial, parahippocampal and hippocampal systems, and because hippocampal–visual systems can support predictive successor-like representations, it is plausible that a sufficiently abstracted relational-control policy could transfer between Gabor and optic-flow wrappers.**

The empirical prediction would be:

```text
If the learner has abstracted the deeper relation,
then after Gabor training they should show:
- reduced initial cost on optic-flow majority binding,
- faster recovery after optic-flow wrapper swap,
- better same-change / path-prediction performance,
- lower lure capture,
- and better delayed recovery than untrained controls.
```

## 7. Implication for the protocol

This gives a strong rationale for using optic flow as a later wrapper, not as the first MVP. The Gabor version is cleaner for calibration because static features are easier to control. The optic-flow version is better as a **dynamic transfer test** because it shifts the task into motion, self-motion and egocentric updating.

The clean protocol sequence would be:

```text
Gabor majority
→ Gabor binding
→ Gabor transformation
→ optic-flow majority
→ optic-flow binding
→ optic-flow transformation
→ cross-wrapper delayed probe
→ puzzle/problem-space handoff
```

The dorsal–ventral convergence and hippocampal predictive-map literature supports your hypothesis, but the transfer claim needs to be demonstrated behaviourally through wrapper-swap costs, recovery slopes, delayed probes and prediction of puzzle/problem-solving outcomes.

[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6740414/?utm_source=chatgpt.com "Orientation-Specific Adaptation in Human Visual Cortex - PMC"
[2]: https://iris.uniroma1.it/bitstream/11573/1707959/1/Sulpizio_common_specific_activations_2024.pdf "Common and specific activations supporting optic flow processing and navigation as revealed by a meta-analysis of neuroimaging studies"
[3]: https://doellerlab.com/wp-content/uploads/2018/08/Nau_Julian_Doeller_TiCS2018.pdf "How the Brain’s Navigation System Shapes Our Visual Experience"
[4]: https://www.nature.com/articles/s42003-024-06719-z "A ventromedial visual cortical ‘Where’ stream to the human hippocampus for spatial scenes revealed with magnetoencephalography | Communications Biology"
[5]: https://gershmanlab.com/pubs/Stachenfeld17.pdf?utm_source=chatgpt.com "The hippocampus as a predictive map"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC9894584/?utm_source=chatgpt.com "Successor-like representation guides the prediction of future ..."




[1]: https://pmc.ncbi.nlm.nih.gov/articles/PMC6675273/?utm_source=chatgpt.com "Representation of Head-Centric Flow in the Human Motion ..."
[2]: https://elifesciences.org/articles/78904?utm_source=chatgpt.com "Successor-like representation guides the prediction of ..."
[3]: https://memory.psych.upenn.edu/files/pubs/KirsEtal00.pdf "p3096 801..818"
[4]: https://www.jneurosci.org/content/42/27/5451.abstract?utm_source=chatgpt.com "Sensory Evidence Accumulation Using Optic Flow in a ..."
[5]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8802932/?utm_source=chatgpt.com "Predictive Representations in Hippocampal and Prefrontal ..."
[6]: https://deepmind.google/blog/the-hippocampus-as-a-predictive-map/ "The hippocampus as a predictive map — Google DeepMind"

[1]: https://pubmed.ncbi.nlm.nih.gov/38777117/?utm_source=chatgpt.com "Attention control training and transfer effects on cognitive ..."
[2]: https://www.nature.com/articles/s41539-023-00161-2?utm_source=chatgpt.com "A dual-process model for cognitive training"
[3]: https://pubmed.ncbi.nlm.nih.gov/27474138/?utm_source=chatgpt.com "Working Memory Training Does Not Improve Performance on ..."
[4]: https://pubmed.ncbi.nlm.nih.gov/24213250/?utm_source=chatgpt.com "Effects and mechanisms of working memory training"
