# Approval Guidelines

Last reviewed: 2026-07-09
Source: SharePoint List field metadata and SAO-Related SPG inventory.

AI approval recommendations are advisory only. The assigned human reviewer makes the final decision.

## Recommend Approve When

- The uploaded document appears to match the expected document type.
- Required fields and pages appear complete.
- File content is readable.
- There are no obvious contradictions in the provided text.
- The document is appropriate for the current workflow step.
- The document includes the core fields listed for its SharePoint form type.

## Recommend Request Info When

- A required field, signature, date, attachment, or page appears missing.
- The text is unreadable, incomplete, or ambiguous.
- The file appears to be the right general document but lacks details needed for review.
- The reviewer needs clarification from the submitter.
- Required workflow actor information is absent, such as adviser email, president email, CSAD/CSFA remarks, College Dean email, or confirmation fields.

## Recommend Reject When

- The file appears to be the wrong document type.
- The document appears invalid, altered, irrelevant, or outside the allowed workflow.
- The request clearly belongs to a different process.
- The same issue has already been requested and not corrected.
- The document contains unnecessary private data that should not be submitted for that workflow.

## Document-Specific Completeness Hints

### Good Moral Character Certificate

Expected fields:
- Date
- Student number
- Name of student
- Program/strand
- Gender
- Number of copies
- Reason for request
- Contact number

Request information if the reason, student number, contact number, or number of copies is missing or unclear.

### Student Activity and Off-Campus Activity

Expected fields:
- Organization or organizer
- Proposed activity
- Activity date and time
- Venue
- Objectives and details
- President and/or adviser details where required

Request information if the activity date/time, venue, adviser email, president email, objectives, or details are missing.

### Fund Raising Activity

Expected fields:
- Organization name
- Fund raising activity name/details
- Date/time range
- Venue
- Objectives
- Adviser email

Do not recommend final approval without human review because SharePoint metadata shows Adviser, CSAD, CFO, and EVP-COO review fields.

### Scholarship Validation

Expected fields:
- Student name and number
- Academic year and term/semester
- Scholarship or discount title
- Term weighted average or equivalent academic standing field
- Supporting documents when using v2.0
- Confirmation when using v2.0

Never state that the student is eligible or guaranteed. Recommend request-info for missing supporting documents or academic fields.

### Sibling Discount

Expected fields:
- Applicant student information
- Sibling student information
- PSA birth certificate and proof of enrollment for v2.0 when applicable
- Confirmation for v2.0

Do not determine family relationship validity or discount eligibility.

### Student Infraction and Letter of Explanation

Expected fields:
- Infraction number or notice number
- Student name and number
- Program/year
- Infraction/offense category
- Description or explanation
- Student email/contact details when required

Never determine guilt, sanctions, or clearance status.

### Advising and Peer Mentoring

Expected fields may include:
- Term/academic year
- Student or mentee name
- College/program
- Areas of concern or issues discussed
- Action taken
- Observed outcomes
- Adviser details where required

Summarize sensitive concerns minimally and defer official academic standing to human advisers or the Registrar where applicable.

## Required Tone

- Be concise and respectful.
- Do not accuse the submitter.
- Say "appears" when the AI is inferring from document text or image content.
- Never present the AI recommendation as an official decision.
- When a policy source is only metadata, say "based on the configured SharePoint form fields" rather than "policy states."

## Sample Recommendation JSON

```json
{"recommendation":"Approve","reasoning":"The document appears complete and matches the expected good moral character certificate request fields."}
```

```json
{"recommendation":"Reject","reasoning":"The uploaded file appears unrelated to the expected student activity form."}
```

```json
{"recommendation":"Request Info","reasoning":"The activity request appears to be missing the proposed venue and adviser email."}
```

<!-- second-sweep-20260710 -->

## Second Sweep Approval Notes - 2026-07-10

### CSAD activities and organizations

- Student activity approval belongs with CSAD for student organization and co-curricular activity handling.
- Adviser approval or certification is a recurring requirement across organization and activity sources.
- Off-campus activities may require participant list, itinerary, signed parent or guardian consent, and current off-campus activity forms.
- Online co-curricular activities are covered by supplemental online guidelines and should be submitted through the current CSAD online mechanism.
- Fund raising requires a fund-raising request process, financial viability support, and post-activity financial reporting.
- Use of institutional name, logo, emblem, or similar marks should be routed for corporate communications approval when applicable.
- External affiliations or external affairs may require Student Affairs Director endorsement and higher approval.

### CSFA scholarships and discounts

- Scholarship, grant, discount, or institutional aid approval belongs with CSFA and the approving authority named in the current program.
- Multiple MCL-sponsored scholarships normally resolve to the highest value benefit unless a program says otherwise.
- Non-MCL sponsored aid is applied first.
- Scholarship undertakings require careful handling because they may create obligations for the student and parent or guardian.
- Scholarship templates from AY/SY 2026-2027 are source evidence, not proof of current availability.

### Discipline

- Discipline and misconduct routing belongs with CSAD.
- The AI service may help a user prepare facts and identify the office, but it must not assign sanctions or determine whether an offense occurred.
