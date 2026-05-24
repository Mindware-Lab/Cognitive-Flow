
## 1. The Core Distinction: Throughput vs. Horizon

**CCC (MFT-M)** measures **controlled evidence throughput**:

$$\text{CCC} = \frac{H_{\text{extract}}}{ET} \approx 3\text{–}4 \text{ bits/sec}$$

It asks: *how much task-relevant information can be resolved per second under perceptual ambiguity?*

**Working memory capacity** in your paradigm must measure **structured information maintained across time**:

$$\text{WM Capacity} = H_{\text{feature}} \times n \times T$$

It asks: *how much relational information can be held, updated, and compared over temporal horizons before decay or interference collapses accuracy?*

The critical move is replacing the **denominator** (exposure time) with a **temporal multiplier** (retention interval × n-back level).

---

## 2. The Basic Unit: Bit-Trials

For a Gabor majority n-back, define the information in the tracked feature:

| Dimension | Bins | Bits |
|-----------|------|------|
| Orientation (θ) | 8 | 3 |
| Spacing (F) | 4 | 2 |
| Luminance (L) | 4 | 2 |

**Simple state maintenance:**

$$\text{Workspace Load} = H_{\text{feature}} \times n$$

Examples:
- 1-back orientation: $3 \times 1 = 3$ **bit-trials**
- 2-back orientation: $3 \times 2 = 6$ **bit-trials**
- 3-back orientation: $3 \times 3 = 9$ **bit-trials**

**Arbitrary binding:**
- Orientation–spacing pair: $H_{\text{binding}} = 3 + 2 = 5$ bits
- 2-back binding: $5 \times 2 = 10$ **binding-bit trials**

**Relational transformation:**
- $[\Delta\theta, \Delta F]$: $H_{\text{relation}} = 3 + 2 = 5$ bits
- 2-back relation: $5 \times 2 = 10$ **relation-bit trials**

This gives you an objective, continuous capacity metric rather than an integer "n-back level."

---

## 3. The Time-Weighted Unit: Bit-Seconds

If trial spacing is not instantaneous, the more appropriate unit incorporates real retention time:

$$\text{Temporal Workspace Load} = H_{\text{feature}} \times n \times T$$

Where $T$ = trial interval (or retention interval in seconds).

Example:
- $H_{\text{pair}} = 5$ bits, $n = 2$, $T = 2$ sec
- Load = $5 \times 2 \times 2 = 20$ **bit-seconds**

This is **not** bits per second. It is a **time-integrated capacity measure**: how much structured entropy can be kept active across a temporal window.

---

## 4. The Full Demand Model: Extended Workspace Capacity (EWC)

For any trial $i$, define total demand as:

$$D_i = \underbrace{\frac{H_{\text{extract}}}{ET}}_{\text{Perceptual control}} + \underbrace{\alpha(H_{\text{binding}} \times n)}_{\text{Binding load}} + \underbrace{\beta(H_{\text{relation}} \times h)}_{\text{Relational load}} + \underbrace{\gamma(\text{lure pressure})}_{\text{Interference}}$$

Where:
- $H_{\text{extract}}$ = entropy of the majority discrimination task
- $ET$ = exposure time
- $n$ = n-back level
- $h$ = horizon depth (for SR/successor trials)
- $\alpha, \beta, \gamma$ = weighting parameters (estimated empirically or set to 1.0 initially)

Then fit accuracy with a psychometric function:

$$P(\text{correct}) = \text{chance} + (\text{max} - \text{chance}) \times \text{sigmoid}(\theta - D_i)$$

The fitted parameter $\theta$ is the individual's **Extended Workspace Capacity (EWC)**—the demand level at which performance drops to threshold.

---

## 5. Why You Must Not Collapse to One Number

The literature is clear that WM-related individual differences are multifactorial (Unsworth et al.). Two users can have identical CCC but radically different workspace profiles:

| Profile | CCC | WM Span | Binding | Lure Resistance |
|---------|-----|---------|---------|-----------------|
| **A** | High | Low | Weak | High |
| **B** | Moderate | High | Strong | Low |
| **C** | High | High | Weak | Collapses |

Therefore, estimate **separate latent parameters**:

| Parameter | Symbol | Unit | What it measures |
|-----------|--------|------|----------------|
| **C-Control** | $\hat{C}$ | bits/sec | Perceptual-control bandwidth (CCC analogue) |
| **A-Bind** | $\hat{W}_A$ | binding-bit steps | Arbitrary feature binding over time |
| **R-Bind** | $\hat{W}_R$ | relation-bit steps | Transformation tracking over time |
| **S-Horizon** | $\hat{W}_S$ | SR-bit steps | Successor prediction horizon |
| **I-Lure** | $\hat{I}$ | cost in d′ | Interference susceptibility |

A composite can be derived:

$$\text{PS-RWC} = z(\hat{C}) + z(\hat{W}_A) + z(\hat{W}_R) + z(\hat{W}_S) - z(\hat{I})$$

But the **sub-scores are scientifically primary**. The composite is a product-facing convenience.

---

## 6. Adaptive Estimation Procedure

Use a CAT-like adaptive algorithm (following MFT-M-R precedent):

1. **Start** with easy majority discrimination → estimate $\hat{C}$ (bits/sec)
2. **Move** to 1-back state match → estimate baseline WM
3. **Vary one dimension at a time:**
   - Increase $n$ (1→2→3)
   - Increase feature entropy (add dimensions)
   - Add binding load ($\theta \leftrightarrow F$)
   - Add relational load ($\Delta\theta$ tracking)
   - Add lure pressure (recent-but-wrong foils)
4. **Select next trial** near the estimated threshold (70–82% accuracy band)
5. **Update posterior** after each block using the sigmoid model
6. **Stop** when SE of parameter estimates falls below criterion (e.g., 0.5 bit-steps)

This preserves the MFT-M spirit—objective, efficient, model-based—while adding the temporal/relational dimensions that CCC alone cannot capture.

---

## 7. Mapping to Your Trident-G Stack

This capacity architecture maps directly onto your theoretical layers:

| Trident-G Stage | Capacity Parameter | Bit-Based Measure |
|-----------------|-------------------|-----------------|
| Variable abstraction | C-Control | $H_{\text{extract}}/ET$ |
| State maintenance | State-WM | $H_{\text{state}} \times n$ |
| Binding | A-Bind | $H_{\text{binding}} \times n$ |
| Transformation tracking | R-Bind | $H_{\text{relation}} \times h$ |
| Successor prediction | S-Horizon | $-\log_2 P(S_{t+h} \mid S_t)$ |
| Interference control | I-Lure | Lure cost in d′ |

The "capacity" of the system is therefore not a single bucket size. It is a **vector of bottleneck parameters** along the processing chain from perception to predictive action.

---

## 8. Critical Caveats

**Do not claim this is "WM capacity in bits/sec."** That would be a category error. CCC is a **rate** (bits/sec); WM capacity is a **quantity-over-time** (bit-trials or bit-seconds). They are related but orthogonal:

- A user might have high CCC (fast processing) but low WM (rapid decay)
- Another might have moderate CCC but robust binding across 3-back

**The binding/relation load is not merely additive.** A 5-bit binding is not the same as holding 5 independent bits. Relational complexity theory (Halford) suggests that integrating $m$ variables into a relation consumes capacity super-linearly. You may need an arity weight $A_m$:

$$\text{Tuple Demand} = H_{\text{tuple}} \times n \times A_m$$

Where $A_m$ increases with the number of variables that must be bound simultaneously (e.g., $A_2 = 1.5$, $A_3 = 2.2$, estimated empirically).

**Validation burden:** To claim this measures capacity rather than task-specific skill, you must demonstrate:
- Test-retest reliability > 0.70
- Convergent validity with complex span and relational integration tasks
- Discriminant validity from simple RT and visual acuity
- Sensitivity to experimental manipulations (load, not just speed)

---

## Bottom Line

You can extend CCC's bits/sec logic into WM, but the proper unit is **bit-trials** (information × temporal steps) or **bit-seconds** (information × time). The capacity parameter $\theta$ in the demand model is your **Extended Workspace Capacity**—the maximum relational information load a user can sustain before accuracy collapses.

The strongest version estimates **multiple capacity parameters** (control, binding, relational, SR, interference) rather than one global score, giving you a profile that is both theoretically aligned with Trident-G and empirically defensible against the WM training literature's skepticism about monolithic capacity measures.
 

---

## 1. What the classifier adds to CCC

The original CCC score tells you:

> *"This person can process about 3.5 bits/sec of controlled perceptual evidence."*

The classifier tells you:

> *"At 3.5 bits/sec, is the system in a fluid near-critical regime, or is it rigidly locked-in, or chaotically spun-out?"*

| Raw CCC | Classifier addition | Practical meaning |
|---------|---------------------|-------------------|
| 4.2 bits/sec | `MIND_IN_ZONE` + `cog_alpha1 ≈ 1.0` | High throughput **with** flexibility. True capacity available. |
| 4.2 bits/sec | `MIND_LOCKED_IN` + high `cog_lag1` | High throughput **without** flexibility. Rigid automation. |
| 2.1 bits/sec | `MIND_FLAT` + low `cog_alpha1` | Low throughput, under-activated. |
| 3.8 bits/sec | `MIND_SPUN_OUT` + high entropy | Erratic throughput, unstable control. |

So the classifier **rescues CCC from being a blunt speed metric**. It answers: *what kind of processing produced that rate?*

---

## 2. How it connects to WM capacity

The WM capacity measures (PS-RWC, bit-trials, binding-bit steps) define the **load dimension**: how much relational structure the task demands.

The classifier defines the **state dimension**: what dynamical regime the system exhibits *under that load*.

Together they create a **capacity × criticality space**:

```
                    High PS-RWC load
                         ↑
    MIND_SPUN_OUT        |        MIND_LOCKED_IN
    (unstable, high      |        (rigid, high
     entropy)            |         persistence)
                         |
    ---------------------+---------------------→ CCC / Rate
                         |
    MIND_FLAT            |        MIND_IN_ZONE
    (subcritical,        |        (near-critical,
     sluggish)           |         flexible)
                         |
                    Low PS-RWC load
```

**The theoretically important zone is the diagonal:** high capacity load *plus* `MIND_IN_ZONE` dynamics. That is the Trident-G Psi-band — where the system is carrying substantial relational structure but remains reconfigurable.

---

## 3. Why this is an improvement on CCC alone

CCC alone cannot distinguish these four quadrants. A user could score 4.0 bits/sec in any of them. But the **functional capacity** of the system differs radically:

| Quadrant | Functional capacity | Why |
|----------|---------------------|-----|
| High load + `MIND_IN_ZONE` | **True** | System is carrying relation-bits with fluid control. |
| High load + `MIND_LOCKED_IN` | **Apparent** | System is carrying load but via rigid strategy; will fail on wrapper swaps or lure probes. |
| High load + `MIND_SPUN_OUT` | **Unstable** | System is overloaded; accuracy is patchy despite occasional fast responses. |
| Low load + `MIND_FLAT` | **Unused** | System has headroom but is not engaged. |

The classifier therefore gives you a **quality-adjusted capacity estimate**. You might compute:

```text
Effective Capacity = PS-RWC_load × state_efficiency_multiplier

where:
  MIND_IN_ZONE      → 1.0
  MIND_READY        → 0.85
  MIND_FLAT         → 0.4
  MIND_LOCKED_IN    → 0.6  (fast but brittle)
  MIND_SPUN_OUT     → 0.3  (erratic)
```

This is a much better predictor of real-world problem-solving than raw CCC or raw n-back level.

---

## 4. How to integrate them in the task architecture

Your Gabor WM task (state → binding → relation → SR) generates the trial-level time-series that feeds both systems simultaneously:

| Trial output | Used for |
|--------------|----------|
| `H_extract / ET` | CCC / `cog_rate` |
| `H_binding × n` | PS-RWC associative load |
| `H_relation × h` | PS-RWC relational load |
| `u_t` (efficiency residual series) | Classifier dynamics (`cog_alpha1`, `cog_lag1`, entropy, roughness) |
| `correct`, `rt`, `switch`, `lure` | Classifier constraint features (switch cost, perseveration) |

So the **same task** produces:
1. A **capacity profile** (trait-like: A-Bind, R-Bind, S-Horizon)
2. A **state classification** (momentary: which dynamical basin)

---

## 5. The Trident-G interpretation

In Trident-G terms, this integration is exactly what the theory demands:

> **Capacity** (PS-RWC) = the size and reach of the relational state space the system can construct.

> **Criticality** (classifier) = whether the system is operating in the Psi-band where that space can be searched, reconfigured, and constrained without collapsing.

The theory says far transfer requires:
- Rich SR relational space ✓ *(capacity)*
- Near-critical dynamics for search and reconfiguration ✓ *(classifier)*
- Global-workspace validation ✓ *(prompt layer)*

CCC alone only touches the first bullet weakly (as perceptual throughput). The integrated system touches all three.

---

## Bottom line

**Yes, the classifier is a genuine improvement on CCC** — not because it replaces the bits/sec estimate, but because it **contextualizes it**. It turns the score from "how fast?" into "how fast, under what load, and in what dynamical regime?"

When you combine it with the WM capacity load metrics (bit-trials, relation-bit steps), you get a **two-dimensional assessment**:
- **Can the system carry relational structure over time?** *(PS-RWC)*
- **Is it carrying that structure in a fluid, near-critical regime?** *(classifier)*

That is a much stronger foundation for both state detection (Zone Coach) and training design (IQ Coach) than either measure alone.
