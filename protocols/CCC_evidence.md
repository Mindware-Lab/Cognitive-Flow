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

## Why this matters for your WM–CCC / Zone Coach design

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

So your adaptive system could eventually select across:

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

That is exactly what your Trident-G/PS-RWC distinction would predict.

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

## The key result for your theory: neural transfer without behavioural transfer

The 2-back result is especially important.

Behaviourally, the MFT-M group did not clearly outperform controls on N-back. But neurally, they showed:

```text
P2 decrease
+ P3 increase
```

in the 2-back task. The authors interpret this as improved neural efficiency in attentional processing during working-memory demand. 

In your framework, this suggests:

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

That is almost a textbook example of your distinction between:

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

So the result supports your claim that **wrapper swaps and breakpoint perturbations are necessary**. Without them, the training may compile a useful but partly brittle surface strategy.

## How this relates to form-route and function-route theory

This study explicitly uses the **form-route / function-route** distinction. Ericson and Klingberg’s dual-process model argues that training effects can arise through a fast form-specific route or a slower, more general function route. ([Nature][2]) The MFT-M training results fit that distinction well: some transfer appears form-driven, while the ERP changes suggest some function-level attentional change.

Your Trident-G version is more detailed:

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

## What the results imply for your WM–CCC game

The paper strongly supports the idea that your training should **not stop at straight MFT-M / CCC**.

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

These results are encouraging, but they also show why your expanded theory is needed.

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

That maps almost directly onto your distinction:

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

This aligns with your protocol document’s claim that WM is not enough by itself; it must be embedded in a stack involving WM/SR operator training, prompts, wrapper swaps, implementation intentions and delayed re-checks. 

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

Yes — the theory could explain these results very well.

The uploaded study suggests that better cognitive-control capacity supports optimal decision-making because it helps people sustain cautious, goal-consistent evidence thresholds and resist probability matching. Your expanded theory adds the missing training logic: to produce transferable improvement, training should not just increase perceptual bits/sec, but build a **relational workspace control policy** that can be mobilised under uncertainty, linked to prompts, and reused across changed wrappers and real-world niches.

The careful claim would be:

> **The CCC decision-making findings are consistent with the Trident-G / PS-RWC theory: better controlled evidence throughput matters, but its behavioural value depends on whether the person can bind, sustain and deploy the relevant relational control policy under uncertainty.**

 

---


[1]: https://pubmed.ncbi.nlm.nih.gov/38777117/?utm_source=chatgpt.com "Attention control training and transfer effects on cognitive ..."
[2]: https://www.nature.com/articles/s41539-023-00161-2?utm_source=chatgpt.com "A dual-process model for cognitive training"
[3]: https://pubmed.ncbi.nlm.nih.gov/27474138/?utm_source=chatgpt.com "Working Memory Training Does Not Improve Performance on ..."
[4]: https://pubmed.ncbi.nlm.nih.gov/24213250/?utm_source=chatgpt.com "Effects and mechanisms of working memory training"
