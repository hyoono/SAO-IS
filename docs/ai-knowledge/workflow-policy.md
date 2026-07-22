# Workflow Policy

Last reviewed: 2026-07-09
Source: SharePoint List field metadata and SAO-Related SPG inventory.

## Roles

- `student`: submits and tracks personal documents.
- `org_officer`: submits organization and student activity documents.
- `faculty`: endorses or reviews documents when assigned as adviser, program chair, college dean, or faculty step.
- `staff`: validates documents, reviews submissions, requests information, and routes operational tasks.
- `center_head`: reviews center-scoped documents such as CSAD Head, CSA, CSFA, or equivalent center review fields.
- `director`: has cross-center oversight; SharePoint metadata shows SAO Director review in scholarship validation and study-aid workflows.
- `admin`: manages configuration, users, workflows, and audit logs.

## Source-Backed Workflow Actors

SharePoint form fields exposed these review actors:

- Adviser and Adviser's Remarks.
- CSAD, CSAD Remarks, CSAD Head, and CSAD Head's Remarks.
- CSA and CSA Remarks.
- CSFA and CSFA Remarks.
- SAO and SAO Remarks.
- SAO Director and SAO Director Remarks.
- CFO and CFO's Remarks.
- EVP-COO and EVP-COO's Remarks.
- College Dean and College Dean's Remarks.
- SAO Electoral Board and SAO EB Remarks.
- HRMO Manager and HRMO Manager Remarks.

Treat these as workflow hints from form metadata, not proof of the current active routing configuration.

## Workflow Suggestions

When suggesting workflow steps:

- Use only system-supported approver roles: `admin`, `staff`, `faculty`, `director`, `center_head`.
- Map named center or office fields to the closest supported role.
- Include a `center_head` step when the form has CSAD, CSA, CSFA, or center-head fields.
- Include `faculty` when the form has Adviser, Program Chair, College Dean, or similar academic endorsement fields.
- Include `director` for SAO Director, CFO, EVP-COO, or high-level final approval contexts.
- Do not include `student` or `org_officer` as approver roles.
- Do not infer final policy from private submitted records.

## Common Patterns

### Advising and Peer Mentoring

Likely route:

```json
[{"name":"Faculty/Adviser Review","role":"faculty"},{"name":"CSA Review","role":"center_head"}]
```

Use for Academic Advising Monitoring Sheet-A/B, Peer Mentoring Monitoring Sheet, Peer Mentoring Session Summary, and Peer Tutorial/Mentoring Request Form.

### Student Activities and Organizations

Likely route:

```json
[{"name":"Adviser Review","role":"faculty"},{"name":"CSAD Review","role":"center_head"}]
```

Use for Student Activity Form, Off-Campus Activity Form, Acceptance of Advisorship, Authorization to Join Student Organization, and Application for Renewal of Organization.

For Fund Raising Activity Form, add finance/executive review:

```json
[{"name":"Adviser Review","role":"faculty"},{"name":"CSAD Review","role":"center_head"},{"name":"CFO Review","role":"director"},{"name":"EVP-COO Review","role":"director"}]
```

### Scholarships, Discounts, and Study Aid

Likely route:

```json
[{"name":"CSFA Review","role":"center_head"},{"name":"SAO Director Review","role":"director"}]
```

Use for Scholarship Validation Form and Scholarship Validation Form v2.0. MCL Study Aid may require HRMO Manager, CSAD, CSFA, and SAO Director review.

### Student Discipline and Good Moral

Likely route:

```json
[{"name":"CSAD Review","role":"center_head"}]
```

Use for Good Moral Character Certificate, Student Infraction Notice, and Letter of Explanation. Always avoid final disciplinary conclusions.

### General SAO Requirements

Likely route:

```json
[{"name":"SAO Staff Review","role":"staff"}]
```

Use for F2F/class assembly requirements, health/consent submissions, and Zoom Meeting Link Request unless a center-specific step is configured.

## Center Scoping

- Center-specific documents should be visible only to users authorized for that center, plus director/admin according to system permissions.
- A center head should only review documents assigned to their center or unscoped steps matching their role.
- If the center is missing or unclear, ask for clarification or return a conservative general workflow.

## Workflow Status Language

Use these terms consistently:

- `pending`: submitted and waiting for first/current action.
- `in_review`: actively moving through workflow review.
- `awaiting_info`: waiting for the submitter to provide additional information.
- `approved`: completed successfully.
- `rejected`: closed with rejection.
- `archived`: stored for recordkeeping and no longer active.

<!-- second-sweep-20260710 -->

## Second Sweep Workflow Rules - 2026-07-10

### Student activities

1. Identify whether the activity is on-campus, off-campus, online, curricular, co-curricular, fund raising, or external-affiliation related.
2. Collect activity title, organizer, adviser, target participants, date, venue or platform, budget, fund source, attachments, and proposed publicity.
3. Route on-campus and online student activities to CSAD; route curricular academic activities to the relevant instructor, program chair, or dean when the source calls for academic approval.
4. For off-campus or overnight activity, ask for itinerary, participant list, signed parent or guardian consent where applicable, adviser approval, and current CSAD form requirements.
5. For postponed or changed activity, do not treat the original approval as automatically valid. Route for updated approval.
6. For completed activities, request the appropriate post-event report. For fund raising, also request financial reporting.

### Organization recognition and renewal

1. Confirm organization name, category, purpose, adviser, membership list, officers, constitution/by-laws, and whether it is new, renewal, or accreditation.
2. Check for prohibited categories or purposes before suggesting next steps.
3. Use the newer CSAD handbook threshold of 15 students as a routing note, but mark membership count as needing current CSAD confirmation because an older rules file referenced 30.
4. Do not say an organization is recognized or accredited until CSAD has issued the official status.

### Scholarship validation and undertakings

1. Identify scholarship or discount type, student level, school year or term, notice received, and whether the student has other scholarships.
2. Ask for the required documents, parent or guardian availability for undertakings, and whether the student has received a CSFA validation instruction.
3. Explain the stable policy only: required documents, proper approval, highest MCL-sponsored benefit unless otherwise stated, and non-MCL aid applied first.
4. Do not reuse template deadlines as current deadlines. Confirm with CSFA.
