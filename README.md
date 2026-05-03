# Cognitive-Flow
Cognitive performance app
# Cognitive Flow

**Cognitive Flow** is a mobile-first cognitive training app built around short, adaptive sessions for attention control, pattern tracking, and transfer validation.

The app is designed to feel simple to the user: a calm daily training ritual with minimal feedback, clear choices, and no cognitive-science dashboard during play. Under the surface, it records detailed behavioural data to estimate cognitive control, training state, learning progress, and whether gains transfer beyond the task itself.

## Core concept

Cognitive Flow is based on two connected training layers:

### 1. Zone Coach

Zone Coach is the core MVP.

It is a 3-minute pre-semantic cognitive-control task adapted from the Backward Masking Majority Function Task. Users make rapid majority judgements over simple visual features such as orientation, spacing, or luminance. The system estimates:

- cognitive control capacity
- current cognitive state
- within-session stability
- recovery after challenge trials
- longitudinal training trajectory

The user-facing message is simple:

> Check your state. Train your control. Find your flow.

### 2. Seeing Patterns

Seeing Patterns is the pattern-training layer.

The task is not standard item-matching n-back. Instead of asking whether the current image is the same as a previous image, the user judges whether the *way the stimulus is changing* is the same.

The basic user-facing rule is:

> Same = the change keeps going  
> Different = the pattern breaks

The first implementation focuses on a **Visual Patterns** lane using a single Gabor-like patch that changes in angle, spacing, and later clarity. A **Motion Flow** lane using optic-flow stimuli is reserved for later validation because mobile timing, refresh rate, dot density, coherence, and motion stability need careful testing.

## Product principle

Cognitive Flow separates the consumer experience from the scientific engine.

The user sees:

- a short session
- simple Same / Different responses
- subtle feedback
- calm completion screens
- light progress dots

The system records:

- accuracy
- reaction time
- adaptive difficulty
- rule-gap thresholds
- n-back level
- stimulus family
- portability probes
- transfer-test outcomes

The science stays in the engine. The user experiences a calm cognitive flow ritual.


---

<img width="525" height="714" alt="ui1" src="https://github.com/user-attachments/assets/6e6af931-19dd-4c5f-a5a5-e6ef2f640779" />
<img width="523" height="561" alt="ui2" src="https://github.com/user-attachments/assets/19a563e1-5dbd-4ac1-8d82-d6391e446602" />
<img width="519" height="643" alt="ui3" src="https://github.com/user-attachments/assets/f7964a08-effd-49ed-afb0-99c90b45bc15" />
<img width="523" height="468" alt="ui4" src="https://github.com/user-attachments/assets/0549c839-b7df-408d-aa12-c95ad9f34b78" />



## MVP training loop

The intended user loop is:

```text
Check state → Train pattern → Finish calmly → Return later
