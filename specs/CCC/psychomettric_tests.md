

### 1. **Experiment Factory Attention Network Test — MIT licence**

This is the most suitable ready-made MIT-licensed option I found:

**Repository:** `expfactory-experiments/attention-network-test`
**Licence:** MIT
**Why useful:** ready web experiment, attention-specific, established paradigm, directly relevant to executive attention/conflict control.

The GitHub page states that it is an “attention network test, derived from the attention network task” and shows an MIT licence. ([GitHub][2])

I would use it like this:

```text
Pre-training ANT
→ Attention Coach / CCC training block over 10–20 sessions
→ Post-training ANT
→ Follow-up ANT after delay
```

Key outcome variables:

```text
ANT executive conflict effect
ANT alerting effect
ANT orienting effect
overall RT
accuracy / error rate
RT variability
```

For your purposes, the **executive conflict effect** is probably the main external criterion, because it is closest to your attention-control construct. Alerting and orienting are useful secondary checks, especially for distinguishing true attention-control change from general vigilance or arousal shifts.

## Strong secondary options

### 2. **jsSART — Sustained Attention to Response Task — MIT licence**

This is a customisable SART built with jsPsych, archived but MIT-licensed. The repo describes it as a “customizable Sustained Attention to Response Task” built with jsPsych, and the licence is listed as MIT. ([GitHub][3])

Use it if you want to test:

```text
sustained attention
lapses
commission errors
RT variability
fatigue sensitivity
```

The original SART literature is strong for sustained attention: Robertson et al. describe it as withholding keypresses to rare targets, and later work found it predictive of everyday attentional failures/action slips. ([PubMed][4])

For Attention Coach, SART is useful as a **state/lapse benchmark**, but it is less directly matched to the CCC mechanism than ANT or flanker.

### 3. **jsPsych Timelines: Arrow Flanker — MIT licence**

The `jspsych-timelines` repository is MIT-licensed and includes an **arrow flanker task** plus a **go/no-go** timeline. The repository says its timelines are shareable/configurable, and the page lists “arrow-flanker” and “go-nogo”; it also lists MIT as the licence. ([GitHub][5])

This is a good lightweight option if you want something shorter than the full ANT:

```text
Arrow Flanker conflict cost
= incongruent RT/accuracy cost minus congruent RT/accuracy
```

It is conceptually close to attention control and response conflict. A recent open-access flanker implementation paper notes that the flanker task is widely used to measure attentional control. ([PMC][6])

### 4. **Go/No-Go jsPsych — MIT licence**

This repository is a jsPsych Go/No-Go implementation with an MIT licence. It uses 80:20 Go/No-Go trials, logs RT and accuracy, and is explicitly framed as measuring response inhibition and cognitive control. ([GitHub][7])

Use it as an inhibition/lapse secondary measure, not the primary validation target.

## My suggested validation battery

For your commercial app, I would not put all of these in the consumer flow. I would use a compact validation battery:

| Role                                     | Test                       | Why                                                                                  |
| ---------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| **Primary external attention benchmark** | **ANT**                    | Best match to attentional networks; gives executive/conflict, orienting and alerting |
| **Short repeated benchmark**             | **Arrow Flanker**          | Lightweight conflict-control measure; closer to arrows and response competition      |
| **Lapse/state control**                  | **SART** or **Go/No-Go**   | Checks sustained attention, impulsive responding and RT variability                  |
| **Transfer benchmark**                   | Matrix Reasoning Benchmark | Already consistent with your spec as a separate external anchor                      |

## Best practical choice

Use **ANT as the main external validation test**, and optionally add **Arrow Flanker** as the short in-app repeatable benchmark.

I would avoid presenting ANT/SART/Flanker as proof that Attention Coach “raises IQ”. Frame them as:

```text
External attention benchmarks used to test whether Attention Coach changes general attentional control, conflict cost, vigilance and response stability.
```

Licence note: MIT is commercially friendly, but you should preserve the licence/copyright notices and check bundled dependencies/assets before shipping. This is especially important for older jsPsych/Experiment Factory code.

[1]: https://pubmed.ncbi.nlm.nih.gov/11970796/?utm_source=chatgpt.com "Testing the efficiency and independence of attentional ..."
[2]: https://github.com/expfactory-experiments/attention-network-test "GitHub - expfactory-experiments/attention-network-test: The attention network test, derived from the attention network task · GitHub"
[3]: https://github.com/shamrt/jsSART "GitHub - shamrt/jsSART: A customizable Sustained Attention to Response Task (SART; described in Robertson et al, 1997) measure, built with jsPsych. · GitHub"
[4]: https://pubmed.ncbi.nlm.nih.gov/9204482/?utm_source=chatgpt.com "performance correlates of everyday attentional failures in ..."
[5]: https://github.com/jspsych/jspsych-timelines "GitHub - jspsych/jspsych-timelines: Shareable, configurable timelines for jsPsych experiments · GitHub"
[6]: https://pmc.ncbi.nlm.nih.gov/articles/PMC11335792/?utm_source=chatgpt.com "Implementation of an online spacing flanker task and ... - PMC"
[7]: https://github.com/vekteo/GoNoGo_jsPsych "GitHub - vekteo/GoNoGo_jsPsych: This repository contains a Go/No-Go Task developed with jsPsych, based on the implementation by Bezdjian et al. (2009). The task is designed to measure response inhibition and cognitive control. · GitHub"
