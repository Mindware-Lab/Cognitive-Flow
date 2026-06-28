

**Use one shared assessment platform, not one shared exposed test item pool.**

A single validated test-bank system can support the three core apps, but the **training items and validation items should be separated** so you do not contaminate your pre/post measures.

The best architecture is:

```text
One IQ Mindware webapp
→ one login / participant ID
→ one assessment bank
→ three training pathways
→ one Proof / Progress dashboard
```

Inside that, the user sees simple routes:

```text
Today
Assessments
Attention Control
Relational Memory
Inference Training
Progress / Proof
Partner Programmes
```

That avoids the clunkiness of separate URLs. The user should not feel they are being sent to different products. They should feel they are inside one cognitive performance platform.

Your spec already supports this. It says the app should use one shared graph engine across the stack, while measuring different cognitive operations at each layer, and that users encounter the same relational structure through extraction, memory, binding, prediction, reasoning and delayed recovery.  It also separates core capacities from transfer/proof measures, which is exactly the distinction needed here. 

I would structure the banks like this:

| Bank                           | Purpose                                                                                    |                  Used for training? |             Used for claims? |
| ------------------------------ | ------------------------------------------------------------------------------------------ | ----------------------------------: | ---------------------------: |
| **External Psychometric Bank** | matrix reasoning, ANT/SART, complex span                                                   |                                  no |                          yes |
| **App-Native Benchmark Bank**  | attention bits/sec, relation n-back, graph n-forward, surprise detection, reasoning drills | limited / benchmark forms separated |              yes, cautiously |
| **Training Item Bank**         | adaptive practice items                                                                    |                                 yes |                no, not alone |
| **Partner Measure Bank**       | company/education bespoke tasks                                                            |                       no or limited | yes, with partner validation |

The key rule is:

```text
Training bank ≠ validation bank
```

You can use the same **assessment infrastructure**, but not the same exposed items for training and pre/post proof.

For the three apps:

| App                           | Shared external tests                                    | App-native measures                                                                              |
| ----------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Attention Control**         | ANT, SART, possibly short vigilance/RT stability         | masked attention-control capacity, wrapper recovery, timing quality                              |
| **Relational Working Memory** | complex span, possibly automated operation/symmetry span | relation n-back, graph-edge n-back, binding n-back, lure resistance                              |
| **Inference Training**        | matrix reasoning, short reasoning tests                  | n-forward, surprise detection, reachability, graph reasoning, symbolic/nonsense/domain reasoning |

For inference training, the graph bank can be shared across relational memory, path prediction and reasoning, because the task question changes by layer: relational memory asks whether a graph-valid state/relation/edge matches n-back, path prediction asks what comes next or whether the graph broke, and reasoning asks what follows when the same graph is expressed in language. 

The strongest implementation would be:

```text
Baseline phase
→ Matrix + ANT/SART + complex span + partner measure

Training phase
→ user chooses or is routed into Attention / Memory / Inference

Benchmark phase every 5–7 sessions
→ app-native benchmark + delayed checks + selected external measures

Post phase
→ alternate forms of matrix / ANT-SART / complex span / partner measure

Follow-up
→ delayed recovery + external benchmark repeat
```

Your spec already recommends benchmark sessions every 5–7 sessions to update profile, measure wrapper recovery, delayed recovery, relation-family transfer and capacity estimates, with optional Matrix Reasoning Benchmark and Real-Life Transfer Check. 

So yes — this is the way to go, but with this product decision:

> **One platform, one dashboard, one assessment bank service, multiple training pathways.**

Not:

> Three separate webapps with separate testing flows.

A good practical route would be:

```text
iqmindware.com/app
  /today
  /assess
  /train/attention
  /train/memory
  /train/inference
  /progress
  /proof
  /partner/[programme]
```

That gives you clean UX, shared data, shared norms, shared pre/post testing, and flexible partner deployment without making the product feel fragmented.
