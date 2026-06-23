→ train relation in Wrapper A
→ detect learning-curve flattening
→ introduce Wrapper B 
→ measure temporary dip
→ train until invariant recovery
→ mix A+B
→ delayed re-check

---

For the CCC games the logic would be:

```text id="nzalvk"
Group A:
arrows first
→ train absolute/relative CCC
→ add BSE within arrows
→ detect flattening/recovery
→ swap to optic flow
→ measure transfer dip and recovery
→ finish with mixed arrows + optic flow

Group B:
optic flow first
→ same progression
→ swap to arrows
→ finish with mixed flow + arrows
```

That is much closer to the transfer protocol, because horizontal transfer is defined as recovering the same relational invariant across changed task surfaces, with wrapper A learning, flattening, wrapper B probe, temporary dip, recovery, A+B mixing and delayed re-check. 

## Why this is stronger

The main advantage is that it separates three things that were previously blurred:

```text id="983mwy"
1. Learning within a carrier
2. Vertical transfer within that carrier
3. Carrier transfer after learning
```

So, in the arrows-first group, you can ask:

```text id="gq9y24"
Within arrows:
Does absolute CCC transfer to relative CCC?
Does CCC transfer upward into BSE?
Does absolute BSE transfer to relational BSE?

Then after the carrier swap:
Does the trained attentional-control/binding invariant recover in optic flow?
```

In the flow-first group, you ask the symmetric question:

```text id="lmmufe"
Does optic-flow training transfer back into arrows?
```

That lets you estimate a genuine asymmetry:

```text id="0gfyuq"
arrow → flow transfer

versus

flow → arrow transfer
```

The app spec already supports this carrier distinction: arrows are psychometrically clean, fast to render and good for timing-sensitive capacity estimation, while optic flow is a later transfer-friendly wrapper that naturally supports dynamic motion, expansion, contraction and trajectory-like inference. 

## The design I would use

I would structure the 20-session pathway like this, while allowing session counts to flex according to learning-curve gates.

### Group A: Arrow-first

| Nominal sessions | Phase                  | Carrier                | Main transfer question                                |
| ---------------: | ---------------------- | ---------------------- | ----------------------------------------------------- |
|              1–3 | Arrow CCC baseline     | Arrows only            | Can the user learn absolute direction extraction?     |
|              4–5 | Arrow frame transfer   | Arrows only            | Does absolute CCC transfer to relative/polar CCC?     |
|              6–8 | Arrow BSE introduction | Arrows only            | Does CCC survive added colour-binding demand?         |
|             9–10 | Arrow BSE expansion    | Arrows only            | Does absolute binding transfer to relational binding? |
|            11–13 | Carrier swap probe     | Optic flow only        | Does the learned invariant recover in optic flow?     |
|            14–15 | Flow BSE recovery      | Optic flow only        | Does the binding invariant recover in flow?           |
|            16–18 | Mixed carrier transfer | Arrows + flow          | Can the user switch unpredictably between carriers?   |
|            19–20 | Delayed consolidation  | Mixed + delayed probes | Does transfer survive delay?                          |

### Group B: Optic-flow-first

Same structure, reversed:

| Nominal sessions | Phase                  | Carrier                | Main transfer question                                          |
| ---------------: | ---------------------- | ---------------------- | --------------------------------------------------------------- |
|              1–3 | Flow CCC baseline      | Optic flow only        | Can the user learn absolute motion/flow extraction?             |
|              4–5 | Flow frame transfer    | Optic flow only        | Does absolute flow transfer to relational/polar flow?           |
|              6–8 | Flow BSE introduction  | Optic flow only        | Does flow CCC survive colour-binding demand?                    |
|             9–10 | Flow BSE expansion     | Optic flow only        | Does absolute flow binding transfer to relational flow binding? |
|            11–13 | Carrier swap probe     | Arrows only            | Does the learned invariant recover in arrows?                   |
|            14–15 | Arrow BSE recovery     | Arrows only            | Does the binding invariant recover in arrows?                   |
|            16–18 | Mixed carrier transfer | Flow + arrows          | Can the user switch unpredictably between carriers?             |
|            19–20 | Delayed consolidation  | Mixed + delayed probes | Does transfer survive delay?                                    |

This is much cleaner than presenting both carriers equally from Session 1.

## The actual learning-curve gates

The session numbers should be nominal. The true progression should be governed by gates:

```text id="0s7pq4"
1. Train current wrapper.
2. Require minimum trials.
3. Detect positive learning.
4. Detect flattening or stable criterion performance.
5. Introduce next wrapper.
6. Measure dip.
7. Track recovery slope across sessions.
8. Mix old + new wrappers only after recovery.
9. Re-check after delay.
```

The full app spec gives the same adaptation principle: increase one difficulty dimension at a time, use a 70–82% balanced-accuracy training band, and follow a wrapper cycle of train A, detect flattening, switch to B, expect a dip, train recovery, mix A+B, and delayed re-check. 

## What transfer signals you get

This design gives you several clean transfer indices.

### 1. Within-carrier frame transfer

```text id="kwlyho"
absolute CCC → relative CCC
```

Example:

```text id="w6x5sl"
ACC_abs_arrow → ACC_rel_arrow_inout
```

or in the other group:

```text id="4zvpe2"
ACC_abs_flow → ACC_rel_flow_inout
```

This tests whether the learner has moved beyond simple direction extraction into frame-relative relation extraction.

### 2. Within-carrier vertical transfer

```text id="pj83hp"
CCC → BSE
```

Example:

```text id="zt5bee"
ACC_abs_arrow → BSE_abs_arrow_colour
ACC_rel_arrow → BSE_rel_arrow_colour
```

This tests whether the extracted attentional relation survives an added binding demand. That is consistent with the app’s vertical stack: Attention Control extracts the signal, Relational Memory holds the relation, Binding Memory preserves the conjunction, Path Prediction predicts the path, and Reasoning explains what follows. 

### 3. Between-carrier horizontal transfer

```text id="lh15bo"
arrows → optic flow
```

or:

```text id="u5nrzq"
optic flow → arrows
```

This is the major carrier swap.

The key measures are:

```text id="qcdxcm"
initial carrier-swap dip
recovery slope
recovery ratio
time-to-recovery
mixed-wrapper stability
delayed mixed recovery
```

### 4. Transfer asymmetry

You can compute:

```text id="hmdcnh"
Asymmetry =
Transfer(arrows → flow) - Transfer(flow → arrows)
```

That tells you whether arrow training scaffolds optic-flow transfer better than optic-flow training scaffolds arrow performance, or vice versa.

## Why this fits the theory better

The Trident-G protocol says not to bank fluency. A structure should only be treated as more transferable when it survives wrapper change, near-miss foils, mixed presentation, prediction/reasoning, and delayed re-check. 

Your revised design does exactly that:

```text id="v29tjb"
first carrier:
build the attentional invariant

within-carrier swaps:
test frame and binding transfer

second carrier:
test whether the invariant survives a surface/modality change

mixed phase:
test whether the learner can recover the invariant unpredictably

delayed phase:
test whether it survives beyond immediate practice
```

That is much closer to an “automation of invariant” model than same-session co-presentation.

## The main caveat

For product use, arrows-first is probably still the default because arrows are cleaner, easier to score and better for timing-sensitive estimates. But for validation, the counterbalanced design is better:

```text id="j0mx4w"
50% arrows-first
50% optic-flow-first
```

The flow-first group may be noisier because optic flow has more display/device variability and may carry a heavier perceptual load. That does not make it a bad design. It just means you should model:

```text id="jhz1eo"
starting carrier
device timing quality
baseline performance
time-to-criterion
dropout/frustration risk
```

## Bottom line

Yes — I would now prefer your revised design.

It gives you a proper learning-curve transfer experiment:

```text id="rtm0o2"
Carrier A learning curve
→ within-carrier frame transfer
→ within-carrier CCC-to-BSE transfer
→ Carrier B perturbation
→ multi-session recovery curve
→ A+B random mixed stability
→ delayed re-check
```

And with the reverse group:

```text id="qruhw2"
Carrier B learning curve
→ Carrier A perturbation
```

you get the crucial asymmetry test.

So the final design should be described as a **counterbalanced carrier-first, learning-curve-gated wrapper-transfer protocol** rather than a same-session paired-measure design.
