# Partner Evaluation Prototype Protocol

## Purpose

Create a short, credible Cognitive Bandwidth prototype that potential affiliates, pilot partners, research collaborators, and commercial partners can view and try before deciding whether to support further development.

The prototype is intended to demonstrate:

- the proposed customer experience
- the masked-arrow task mechanics
- Direction and Frame task concepts
- the planned scoring and adaptive architecture
- likely use cases and delivery format
- the distinction between a product prototype and a validated assessment

It is not intended to provide a final scientific assessment or support high-stakes decisions.

## Prototype Status Statement

Show this statement before a partner starts:

> This prototype demonstrates the proposed task, user experience, and scoring architecture. Its measurements are preliminary and are not yet validated for individual assessment.

Also state:

> Direction Bandwidth is based on MFT-M-style cognitive-control capacity methods. Frame Bandwidth is an experimental relational extension. These are IQ-relevant component measures, not a full IQ test.

## Intended Audience

The evaluation link may be shared with:

- affiliate and referral partners
- training and education providers
- corporate learning and performance teams
- universities and research collaborators
- cognitive-performance practitioners
- funders and product-development partners
- prospective pilot customers

The prototype should not be publicly marketed as a validated test.

## Partner Evaluation Questions

The experience should help a partner decide:

1. Is the task understandable without live support?
2. Does the experience feel credible and professionally presented?
3. Is the proposed measure relevant to the partner's audience?
4. Could the app fit an existing programme, service, or research pilot?
5. Is the session burden acceptable?
6. What validation evidence would the partner require?
7. Would the partner consider a pilot, referral arrangement, or development collaboration?

## Recommended Evaluation Journey

Target duration:

```text
8-12 minutes
```

Flow:

```text
Partner introduction
-> Prototype status and consent
-> Scientific rationale
-> Device timing check
-> Direction tutorial
-> Short Direction demonstration
-> Frame tutorial
-> Short Frame demonstration
-> Illustrative result
-> Full-product roadmap
-> Partner feedback
-> Pilot-interest form
```

## 1. Partner Introduction

Suggested copy:

> Cognitive Bandwidth is a proposed IQ Coach component for measuring and training cognitive control under time pressure.
>
> This short demonstration lets you experience the task and review how a future validated product could work.

Primary action:

```text
Try the prototype
```

Secondary action:

```text
Review the protocol
```

## 2. Prototype Status and Consent

Explain:

- this is an early product prototype
- results are preliminary
- results must not be used for diagnosis, recruitment, education placement, or employee assessment
- participation is optional
- anonymous usability data is collected only with consent

Consent choices:

```text
Try without saving feedback
Try and share anonymous usability data
```

Do not require research consent merely to view the prototype.

## 3. Scientific Rationale

Keep this to one short screen:

> Cognitive control supports the selection and use of goal-relevant information. The Direction task uses brief masked-arrow displays based on MFT-M-style cognitive-control capacity methods.
>
> The Frame task extends the same majority judgement to direction relative to a centre. This relational extension is a development hypothesis that requires independent validation.

Provide links to the detailed protocol and primary references outside the active task.

## 4. Device Timing Check

Run a short browser timing check before the demonstration.

Display:

- refresh-rate estimate
- timing quality: Good, Acceptable, or Limited
- a plain-language explanation

If timing is Limited:

- allow the demonstration to continue
- mark the result as illustrative
- do not present a precise individual estimate

## 5. Direction Demonstration

Tutorial:

> Five arrows appear briefly and are then masked. Choose the direction most arrows were pointing.

Use:

- 3 guided practice trials
- 12-18 demonstration trials
- Left and Right responses
- a reduced adaptive condition pool
- immediate, subtle feedback

The short demonstration is for comprehension and experience, not a reliable capacity estimate.

## 6. Frame Demonstration

Tutorial:

> Now judge direction relative to the centre. Out means away from the centre. In means towards the centre.

Use:

- 3 guided practice trials
- 12-18 demonstration trials
- Out and In responses
- the same visual structure as Direction

Explicitly label Frame Bandwidth as an experimental relational extension.

## 7. Illustrative Results

Do not present the short demonstration result as a validated personal score.

Preferred presentation:

```text
Prototype session complete

Direction task:
Demonstration estimate available

Frame task:
Demonstration estimate available

Timing quality:
Good

Reliability:
Insufficient trials for individual assessment
```

An optional numerical display may be enabled for supervised demonstrations, but it must include:

```text
Illustrative estimate only
Not validated for individual assessment
```

## 8. Full-Product Preview

After the demonstration, explain that the proposed full product adds:

- longer adaptive Quick and Standard sessions
- server-computed canonical estimates
- confidence intervals
- personal baselines
- timing-contamination checks
- secure accounts and private results
- progress tracking
- later wrapper-recovery and flexible-bandwidth research

Do not imply these features are already implemented if they are still planned.

## 9. Partner Feedback Form

Keep the form brief.

Suggested questions:

1. What type of organisation or audience do you represent?
2. How clear was the Direction task?
3. How clear was the Frame task?
4. How credible did the experience feel?
5. Where could this fit within your work?
6. What evidence would you need before using or recommending it?
7. What concerns or barriers do you see?
8. Would you consider a pilot or further discussion?

Response options for question 8:

```text
Yes, discuss a pilot
Yes, discuss an affiliate relationship
Yes, discuss research collaboration
Possibly, after further validation
Not currently
```

Collect contact details separately and only when the partner requests follow-up.

## 10. Pilot-Interest Summary

After form submission:

> Thank you. Your feedback will be used to decide the next development and validation stage.

For interested partners, provide:

- proposed pilot formats
- expected participant numbers
- approximate session burden
- data and privacy approach
- validation questions
- contact route

## Data Collection

With anonymous usability consent, record:

- prototype start and completion
- tutorial completion
- Direction and Frame comprehension errors
- timing-quality category
- session abandonment point
- device and browser class
- feedback-form completion
- partner-interest category

Do not collect or share:

- public individual rankings
- inferred IQ
- diagnostic labels
- employment or education suitability
- raw performance data without explicit consent

## Success Criteria

The prototype is ready for partner evaluation when:

- a first-time user can complete it without live instruction
- the complete journey takes no more than about 12 minutes
- timing limitations are clearly communicated
- every result is labelled as preliminary or illustrative
- the scientific foundation and experimental extension are clearly separated
- feedback and pilot interest can be submitted
- no partner can mistake the prototype for a validated individual assessment

Useful evaluation targets:

```text
Prototype completion >= 75%
Direction tutorial comprehension >= 90%
Frame tutorial comprehension >= 80%
Median credibility rating >= 4/5
No unresolved claims-boundary failures
```

These are product-evaluation targets, not scientific validation thresholds.

## One-Day Build Scope

A focused one-day implementation can reasonably include:

- branded landing and scope screens
- timing check
- Direction and Frame tutorials
- short deterministic demonstrations
- illustrative completion screen
- protocol and science links
- feedback and pilot-interest form
- Cloudflare preview deployment

Do not treat the following as one-day completion requirements:

- validated individual scoring
- hardened server-side trial reconstruction
- production reliability thresholds
- test-retest evidence
- population norms
- full accessibility and browser certification
- production-grade export and deletion workflows

## Decision Gate After Partner Review

Use the feedback to choose among:

```text
Stop:
  insufficient comprehension, relevance, or partner demand

Revise:
  promising concept but task, positioning, or burden needs work

Pilot:
  run a small supervised usability and reliability study

Develop:
  fund the full authenticated adaptive product

Collaborate:
  proceed with a research, affiliate, or programme-integration partner
```

The next investment decision should consider both market interest and validation feasibility. Positive partner feedback alone does not establish measurement validity.

