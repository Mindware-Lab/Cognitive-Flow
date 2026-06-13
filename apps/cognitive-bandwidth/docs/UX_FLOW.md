# Cognitive Bandwidth UX Flow

## Navigation

The signed-in app uses four primary destinations:

```text
Today | Train | Results | Settings
```

Hide navigation during active trial blocks.

## First-Run Journey

```text
Welcome
-> Scientific basis and scope
-> Device timing check
-> Input and accessibility preferences
-> How it works
-> Direction tutorial
-> Frame tutorial
-> Email sign-in
-> First Direction calibration
-> Result
-> Recommended next step
```

Tutorials and timing checks can run before authentication. Require authentication before storing a scored session.

## Returning Journey

```text
Today
-> Recommended session
-> Ready screen
-> Adaptive mini-blocks
-> Session result
-> Next step
-> Today or Results
```

## Initial Screens

1. Welcome
2. Scientific basis and scope
3. Device timing check
4. Input preferences
5. How it works
6. Direction tutorial
7. Frame tutorial
8. Email sign-in and link-sent state
9. Today
10. Train menu
11. Direction session setup
12. Frame session setup
13. Active trial states
14. Mini-block pause
15. Interrupted-session recovery
16. Session result
17. Result explanation
18. Results overview
19. Direction detail
20. Frame detail
21. Frame Cost detail
22. Settings
23. Help and glossary
24. Timing-limited warning
25. Still-calibrating state

## Active Trial Flow

```text
Fixation
-> Stimulus
-> Mask
-> Response
-> Feedback
-> Inter-trial interval
```

During active trials show only:

- central stimulus field
- response controls when enabled
- subtle session progress

Do not show:

- accuracy
- bits/sec
- threshold
- entropy
- difficulty
- recent results
- technical wrapper names

## Result Hierarchy

Direction result:

```text
Direction Bandwidth
3.4 bits/sec

Today's estimate
Recent baseline: 3.2 bits/sec
Confidence: Moderate
Timing quality: Good
```

Frame result:

```text
Frame Bandwidth
2.8 relational bits/sec

Today's estimate
Recent baseline: 2.7
Confidence: Moderate
Timing quality: Good
```

Only show Frame Cost numerically when both component estimates are usable. Otherwise show `Still calibrating`.

## Claims and Copy

Use:

- objective behavioural estimate
- MFT-M-style cognitive-control method
- IQ-relevant component measure
- experimental relational extension
- confidence and timing-quality labels

Avoid:

- scientifically validated app
- this is your IQ
- IQ increase
- diagnosis
- guaranteed transfer

## Visual Contract

- white or pale background
- cyan primary action
- deep blue structural text
- lime only for success and valid timing
- red only for brief error feedback
- large response controls
- mobile edge-to-edge shell
- desktop shell no wider than 900 px
- no scrolling inside the active stimulus field

Use `protocols/MVP-2026/iqm-ccc-app-style.css` and the six onboarding images as the starting visual system.

