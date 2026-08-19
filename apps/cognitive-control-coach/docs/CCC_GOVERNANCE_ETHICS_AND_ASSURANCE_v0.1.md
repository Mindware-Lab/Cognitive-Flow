# Cognitive Control Coach — Governance, Ethics and Assurance v0.1

**Status:** Canonical cross-cutting governance contract for Cognitive Control Coach  
**Date:** 20 August 2026  
**Product:** IQ Mindware — Cognitive Control Coach  
**Canonical route:** `/cognitive-control-coach/`  
**Source path:** `IQ-Coach/apps/cognitive-control-coach`  
**Applies to:** standalone use, early access, research and pilot use, and use as an optional intervention within Cognitive Systems Intelligence (CSI)

---

## 1. Purpose

This document consolidates the governance, ethical and assurance requirements that apply across the Cognitive Control Coach product, protocol, data model, scoring system, real-life practice layer, research use and organisational deployment.

Governance is part of the cognitive system itself. It determines:

```text
what may be measured
what may be inferred
what may be recommended
what may be automated
what may be disclosed
what may influence access or progression
who may decide
who may review or challenge a decision
and what safeguards must remain in place
```

The governing principle is:

> **Use personal data to support the participant, use appropriately aggregated evidence to improve systems, and never convert provisional task estimates into unsupported judgements about a person.**

No Cognitive Control Coach score, status, self-report, omission pattern, engagement record or progression state may by itself determine an employment, educational, clinical, insurance, disciplinary, eligibility or other consequential decision.

---

## 2. Legitimate purpose and permitted use

Cognitive Control Coach may be used for:

- non-clinical cognitive practice and self-development;
- estimating performance within the app’s trained attention-control and relational-memory tasks;
- tracking personal learning curves and trained-format recovery;
- delivering versioned real-life implementation prompts that remain separate from task scores;
- early-access engineering and usability evaluation;
- ethically approved research and pilot evaluation;
- a bounded intervention inside CSI when a capacity-development hypothesis has sufficient support;
- aggregate programme evaluation where privacy, consent and minimum-group safeguards are satisfied.

Cognitive Control Coach must not be presented or used as:

- an official IQ test;
- a clinical, neurological or psychiatric diagnostic tool;
- proof that general intelligence has increased;
- proof of far transfer to work, study or everyday functioning;
- an employee, learner, patient, client or athlete ranking system;
- a selection, promotion, disciplinary, insurance or eligibility screen;
- a covert monitoring or productivity-surveillance system;
- a substitute for professional, organisational or clinical judgement;
- evidence that an observed workflow problem belongs primarily to the individual.

Where the app is used within CSI, it remains an optional **Develop** intervention. It must be selected only after competing capacity, coupling, niche and mixed explanations have been considered.

---

## 3. Human authority and decision rights

### 3.1 Participant authority

The participant retains the right to:

- understand what the app measures and what it does not measure;
- choose whether to participate where participation is not a lawful and proportionate condition of a separately governed study;
- pause, stop or leave a session;
- decline optional real-life prompts or self-report questions;
- view their own progress information in plain language;
- request correction, export or deletion where applicable;
- challenge an inaccurate or inappropriate interpretation;
- request human review of a consequential use or disputed data issue.

A participant’s decision not to train, not to answer an optional self-report item or not to share data must not be interpreted as a cognitive or motivational deficit.

### 3.2 Authorised human responsibility

Authorised humans retain final responsibility for:

- the purpose of a pilot or deployment;
- acceptable trade-offs and protected constraints;
- interpretation of personal or group-level evidence;
- research inclusion and withdrawal decisions;
- changes to workload, education, care, training or role conditions;
- any employment, educational, safeguarding, clinical or eligibility decision;
- intervention approval, continuation, adaptation or cessation;
- handling complaints, incidents, appeals and redress;
- ethical, legal and professional accountability.

No automated process may make an irreversible consequential decision about a person from Cognitive Control Coach data.

---

## 4. Privacy, consent and data minimisation

### 4.1 Data minimisation

Collect only data needed for an explicit product, research, security, support or validation purpose.

The default data design should prefer:

```text
pseudonymous participant identifier
+ task and timing data
+ versioned progression state
+ minimum account entitlement data
```

Email, payment and access-entitlement data should remain logically separated from task-performance data wherever practical. Commerce and authentication data must not be used to infer cognitive performance.

Special-category health data must not be collected unless there is a separately justified purpose, lawful basis, explicit governance route and appropriate consent or other valid legal authority.

### 4.2 Consent separation

Consent or permission should be distinguishable for:

- account creation and service delivery;
- storage of personal progress across devices;
- optional real-life practice self-report;
- research use of de-identified or pseudonymised data;
- organisational or cohort-level evaluation;
- contact for future research or product updates.

Consent to use the product does not automatically constitute consent to research, organisational reporting or marketing.

### 4.3 Purpose limitation and retention

Every stored field should have:

```text
purpose
lawful basis or permission route
visibility scope
retention class
responsible owner
export/delete rule
```

Data must not be repurposed for ranking, selection, disciplinary monitoring or unrelated behavioural profiling without a new and independently defensible governance basis.

### 4.4 Self-report separation

Real-life prompts and outcome/barrier check-ins are subjective application evidence. They must remain separate from:

- task scores;
- learning-curve progression;
- wrapper gates;
- programme completion;
- access entitlement;
- population norms.

A self-report may inform personal reflection or a separately specified research analysis, but must not silently alter the person’s cognitive score or programme route.

---

## 5. Support, not surveillance

Cognitive Control Coach should default to an **aggregate-first** model in organisational and institutional settings.

Ordinary managers, educators, service leads or other institutional decision-makers should not receive person-level cognitive profiles by default.

Permitted organisational views should normally emphasise:

- programme participation at an appropriately aggregated level;
- data quality and confidence;
- workflow or cohort patterns;
- common support needs;
- intervention uptake;
- trained-format and delayed evidence at group level;
- system or coupling changes that may be needed.

The system must not provide or enable:

- hidden background monitoring;
- punitive use of absence, pauses, omissions or low engagement;
- automatic “low performer” lists;
- individual cognitive ranking for managers;
- unsupported inference from app performance to job, academic or clinical competence;
- cross-linking with productivity, disciplinary, insurance or eligibility systems without an independently governed and lawful purpose.

Organisational reports require explicit visibility rules, suitable aggregation and suppression of small groups where re-identification risk is material.

---

## 6. AI delegation, verification and provenance

Cognitive Control Coach currently relies primarily on versioned task logic and scoring rather than generative AI. Any future AI-assisted feature must remain within an explicit governance contract.

AI may assist with:

- plain-language explanation;
- accessibility adaptation;
- structured reflection;
- generation of candidate support prompts for human review;
- summarisation of authorised aggregate evidence;
- anomaly detection for technical or data-quality review.

AI must not autonomously:

- change canonical scores;
- change progression gates;
- grant or remove commercial access;
- label a person as impaired, deficient or unsuitable;
- produce consequential recommendations without authorised human review;
- generate public task items or intervention content without versioning and review;
- obscure the evidence, rule or model that produced a recommendation.

Any AI-generated or AI-assisted public content must record:

```text
model or tool used
content or prompt version
human reviewer
approval status
permitted use
retirement status
```

The canonical score must remain produced or verified by a versioned scoring process. AI commentary is advisory and must not overwrite raw trials or derived estimates.

---

## 7. Evidence, inference and claims boundaries

The system must keep the following evidence classes distinct:

```text
TASK PERFORMANCE
what happened in a trained task?

LEARNING-CURVE EVIDENCE
how did performance change within a versioned stage?

TRAINED-FORMAT TRANSFER
did the policy recover across the app’s trained wrappers and delay?

TRANSFER INTENTION
did the app prompt a real-life strategy or mission?

SUBJECTIVE APPLICATION EVIDENCE
did the participant report noticing or using it outside the app?

EXTERNAL OUTCOME
did functioning change in an independent real task or validated measure?
```

These classes must not be collapsed into one omnibus transfer score.

Specific safeguards include:

- `supported_unlock` must never be represented as established transfer;
- `full_transfer` refers only to the trained-format programme evidence contract;
- workflow prompts are transfer intentions, not transfer outcomes;
- app improvement does not establish real-world or general-intelligence change;
- observational associations must not be presented as causal findings;
- a cognitive measure must not be treated as proof that a workflow problem is caused by the measured capacity;
- confidence, timing quality, trial count and model version must accompany interpretations where material;
- population norms or percentiles must not be displayed without adequate and relevant calibration data.

Claims must be controlled through a versioned claims register specifying:

```text
claim text
permitted audience
supporting evidence tier
required qualification
prohibited stronger interpretation
owner
review date
```

---

## 8. Fairness, accessibility and sector safeguards

### 8.1 Accessibility

The product should support, test and document where applicable:

- keyboard and touch interaction;
- responsive layouts without content overspill;
- reduced-motion alternatives;
- readable text and sufficient contrast;
- clear instructions and response mappings;
- pause and recovery routes;
- device-timing quality flags;
- accessibility-compatible alternatives that do not silently change the construct being measured.

An accommodation that materially changes task demand must be recorded and interpreted appropriately rather than hidden.

### 8.2 Fairness and measurement comparability

Performance may vary with:

- device class and refresh rate;
- browser and rendering stability;
- input method;
- display size;
- language and instruction comprehension;
- prior exposure;
- age and relevant accessibility needs;
- environmental distraction.

The system must therefore avoid unsupported cross-person comparison and test for differential measurement behaviour before using normative interpretations.

### 8.3 Sector-specific safeguards

Additional governance is required when used in:

- **employment:** no routine individual ranking, selection or disciplinary use;
- **education:** no unsupported progression, grading or special-needs inference;
- **health or care:** no diagnostic or treatment decision without separate clinical governance;
- **research:** ethics, consent, protocol registration and data-management requirements;
- **sport or performance:** no unsupported selection, contract or return-to-play decision;
- **public or high-reliability services:** explicit authority, escalation and safety rules.

Until a separate under-18 governance route is approved, public self-directed use should follow the product’s 16+ minimum-age policy.

---

## 9. Intervention approval and change control

All material product decisions must be versioned.

A material change includes any change to:

- construct definition;
- task rule or stimulus grammar;
- scoring or confidence model;
- learning-curve gate;
- progression or lockout logic;
- programme status semantics;
- real-life practice content;
- data collection or visibility;
- research use;
- AI role;
- claims language;
- age or sector eligibility;
- authentication, payment or access coupling.

Material changes require:

```text
change proposal
→ rationale and expected effect
→ scientific / product review
→ privacy and claims review where relevant
→ implementation and test plan
→ version increment
→ release record
→ rollback route
```

Protocol, configuration, scoring-model and claims versions must remain distinguishable.

Old raw trials must remain attributable to the version under which they were collected. A later model may rescore historical raw data, but it must not overwrite or erase the original derived record.

Authentication and commercial entitlement changes require separate review. Payment status must not alter cognitive scores, and cognitive performance must not alter payment entitlement unless a transparent non-punitive programme-access rule has been explicitly specified.

---

## 10. Contestability, appeal, override and redress

The system should make important inferences and access decisions contestable.

A participant should be able to:

- see a plain-language explanation of what a score or status means;
- see whether an estimate is calibrating, timing-limited or based on insufficient data;
- report a scoring, access, timing or progression problem;
- request that a technically contaminated session be reviewed or voided;
- correct account information;
- challenge an inappropriate institutional interpretation;
- request human review where a decision materially affects them;
- use applicable export, deletion or withdrawal routes.

Authorised operators must be able to:

- override a clearly erroneous automated gate with a recorded reason;
- restore access following an entitlement or migration error;
- void contaminated data without deleting the audit record;
- suspend an unsafe or misleading feature;
- roll back a model, configuration or release;
- record remediation and affected-user communication.

Overrides must be logged. They must not silently rewrite history.

---

## 11. Auditability, incident handling and assurance

### 11.1 Auditability

The system should preserve auditable records of:

- protocol, configuration and model versions;
- canonical scoring inputs and outputs;
- gate decisions and reasons;
- access-entitlement changes;
- consent and privacy-notice versions;
- administrator access to sensitive data;
- data exports, deletions and corrections;
- intervention approvals;
- content approvals and retirements;
- consequential human review and override decisions;
- deployment, build and rollback provenance.

### 11.2 Incident classes

Governance incidents include, but are not limited to:

```text
security or privacy breach
unauthorised person-level visibility
incorrect access denial or lockout
scoring or progression defect
timing contamination presented as high-confidence data
loss or corruption of raw trials
misleading claim or unsupported interpretation
unreviewed AI-generated public content
failure of export, deletion or withdrawal route
access/payment data improperly coupled to cognitive scoring
```

### 11.3 Incident response

The minimum response loop is:

```text
DETECT
→ CONTAIN
→ PRESERVE EVIDENCE
→ ASSESS SCOPE AND RISK
→ CORRECT OR ROLL BACK
→ INFORM AFFECTED PARTIES WHERE REQUIRED
→ PROVIDE REMEDY
→ DOCUMENT ROOT CAUSE
→ UPDATE TESTS, CONTROLS AND GOVERNANCE
```

### 11.4 Release assurance

Before a material public release or organisational pilot, review:

- functional and regression tests;
- data migrations and rollback;
- access and entitlement flow;
- privacy and visibility rules;
- claims and user-facing explanations;
- accessibility and viewport behaviour;
- device-timing and data-quality handling;
- incident and support routes;
- model/configuration provenance;
- separation of self-report, scores and progression.

---

## 12. Protocol, model and data governance

Maintain immutable registries for:

```text
ProtocolRegistry
ConfigurationRegistry
MeasurementModelRegistry
ClaimsRegistry
ContentRegistry
ConsentRegistry
GovernancePolicyRegistry
IncidentRegistry
```

A measurement-model record should include:

- model ID and immutable version;
- construct and public label;
- evidence tier;
- demand and scoring formula;
- calibration-table version;
- standard-error and confidence method;
- timing and exclusion rules;
- required trial count and wrapper coverage;
- approved claims and prohibited interpretations;
- creation, approval and retirement dates.

Raw trials and derived estimates must remain separate. Client-side calculations are display aids; the canonical estimate should be generated or verified by the authorised scoring service.

Progression decisions must store:

```text
gate rule version
input evidence window
data-quality exclusions
decision
reason
reviewability
```

Real-life practice content must be versioned and reviewed separately from the task protocol. Content changes must not alter scores or progression unless an explicit new protocol version specifies that relationship.

---

## 13. IP, publication and knowledge stewardship

Governance also applies to the knowledge created through the product.

The project should maintain:

- background and foreground IP records;
- contributor and contractor IP assignments;
- provenance for adapted published tasks and original extensions;
- licences and attribution requirements;
- versioned protocol and scoring documentation;
- publication and confidentiality review;
- research consent and data-sharing boundaries;
- anonymisation or de-identification standards;
- AI-output provenance where AI assists content or analysis;
- retention of null, adverse and boundary-condition findings.

No publication, partner report, case study or dataset release may expose identifiable participant data or exceed the permissions under which the data were collected.

Commercial confidentiality must not be used to erase adverse findings, known limitations or safety-relevant boundary conditions from internal governance records.

---

## 14. Minimum governance records

A deployment should be able to represent at least:

```text
governance_policy_version
privacy_notice_version
consent_version
permitted_use
prohibited_use
visibility_scope
decision_owner
human_review_required
retention_class
research_use_status
claims_register_entry
model_card_id
incident_id
override_reason
```

Where Cognitive Control Coach is used within CSI, the intervention record should also identify:

```text
pressure_point
leading constraint hypotheses
why a Develop intervention was selected
protected constraints
predicted mechanism
outcome measures
review date
continue / adapt / stop / reopen decision
```

---

## 15. Minimum governance gate before organisational deployment

Before an organisational or institutional deployment begins, the responsible owner must be able to answer:

1. What is the legitimate purpose?
2. What data are collected, and why?
3. Who can see person-level, group-level and raw data?
4. What decisions may and may not use the data?
5. What is optional for the participant?
6. How are small groups and re-identification risks handled?
7. How are cognitive scores separated from workflow outcomes and self-report?
8. What human retains final authority?
9. What is the complaint, correction, export, deletion and withdrawal route?
10. What happens after an access, scoring, privacy or progression incident?
11. Which protocol, configuration, scoring, consent and claims versions apply?
12. What evidence would cause the intervention to be adapted, stopped or rejected?

If these questions cannot be answered, the deployment is not governance-ready.

---

## 16. Compact governance contract

```text
PURPOSE-LIMITED
Use the app only for an explicit and defensible purpose.

HUMAN-AUTHORISED
Keep consequential judgement and responsibility with authorised humans.

DATA-MINIMISED
Collect only what the purpose requires.

AGGREGATE-FIRST
Use group patterns for system improvement; do not default to person ranking.

EVIDENCE-SEPARATED
Keep task performance, transfer evidence, self-report and real-world outcomes distinct.

VERSIONED
Preserve protocol, model, content, consent, claims and decision provenance.

CONTESTABLE
Allow correction, review, override and redress.

ACCESSIBLE
Design for fair and usable participation while recording material task changes.

SUPPORTIVE
Use data to support participants and improve conditions, not to punish or surveil.

BOUNDARY-AWARE
Bank evidence together with its limitations, context and conditions of use.
```

The final governance rule is:

> **Cognitive Control Coach should strengthen human cognitive agency without turning provisional cognitive data into an unaccountable control surface over the person.**
