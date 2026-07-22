# Examples

Last reviewed: 2026-07-09
Source: SharePoint form metadata and existing SAO-IS prompt patterns.

## Document Classification - Good Moral

Prompt:
```text
Description: I need a certificate of good moral character for my internship requirement.
Available Types: [{"id":"1","name":"Good Moral Character Certificate"},{"id":"2","name":"Scholarship Validation Form"}]
```

Ideal JSON:
```json
{"matched_id":"1"}
```

## Document Classification - Student Activity

Prompt:
```text
Description: Our organization will submit the details for a campus activity including adviser email, venue, objectives, and date of activity.
Available Types: [{"id":"4","name":"Student Activity Form"},{"id":"5","name":"Sibling Discount Application Form v2.0"}]
```

Ideal JSON:
```json
{"matched_id":"4"}
```

## Document Classification - Scholarship Validation

Prompt:
```text
Description: I need to submit my academic year, term weighted average, scholarship title, and supporting documents for validation.
Available Types: [{"id":"6","name":"Scholarship Validation Form v2.0"},{"id":"7","name":"Peer Tutorial/Mentoring Request Form (College)"}]
```

Ideal JSON:
```json
{"matched_id":"6"}
```

## Workflow Suggestion - Fund Raising

Prompt:
```text
Document Type: Fund Raising Activity Form
Center: CSAD
```

Ideal JSON:
```json
[{"name":"Adviser Review","role":"faculty"},{"name":"CSAD Review","role":"center_head"},{"name":"CFO Review","role":"director"},{"name":"EVP-COO Review","role":"director"}]
```

## Workflow Suggestion - Scholarship Validation

Prompt:
```text
Document Type: Scholarship Validation Form v2.0
Center: CSFA
```

Ideal JSON:
```json
[{"name":"CSFA Review","role":"center_head"},{"name":"SAO Director Review","role":"director"}]
```

## Approval Recommendation - Good Moral Request Info

Prompt:
```text
Expected Document Type: Good Moral Character Certificate
Document Text: Name of Student: Student Name. Program: BS Example. Reason: [blank].
```

Ideal JSON:
```json
{"recommendation":"Request Info","reasoning":"The request appears to be missing the reason for request and other required details needed for review."}
```

## Approval Recommendation - Student Activity Request Info

Prompt:
```text
Expected Document Type: Student Activity Form
Document Text: Proposed activity and objectives are present, but venue and adviser email are missing.
```

Ideal JSON:
```json
{"recommendation":"Request Info","reasoning":"The student activity request appears to be missing the venue and adviser email."}
```

## Sensitive Discipline Question

Prompt:
```text
Does this student have a major offense and can they be cleared?
```

Ideal Output:
```text
I cannot determine disciplinary findings or clearance status. Please refer this to authorized SAO/CSAD staff or use the official SAO-IS record.
```

## Tagalog Accessibility

Prompt:
```text
Translate this request-info message into clear Tagalog for students.
```

Style:
```text
Kailangan pa ng karagdagang impormasyon bago maipagpatuloy ang pagsusuri ng iyong dokumento. Pakitingnan ang remarks sa SAO-IS at i-upload ang hinihinging update.
```

<!-- second-sweep-20260710 -->

## Second Sweep Training Examples - 2026-07-10

### Example: Online organization activity

User: Our org wants to hold an online seminar next week. What do we need?

Good answer: Route to CSAD. Ask for activity title, adviser, date, platform, participants, budget, and whether it is co-curricular. Mention that the supplemental online guidance references a Student Online Co-Curricular Activity MS Form at least 7 days before the activity, but confirm the current CSAD process.

Bad answer: "You are approved if you submitted the form."

### Example: Scholarship undertaking

User: I got an Academic Achievement Incentive email. Am I guaranteed 50 percent?

Good answer: Route to CSFA. Ask for the exact notice, school year, student level, strand or program, documents, and whether the parent or guardian can sign the undertaking. Explain that templates show 25 and 50 variants but final eligibility and benefit require CSFA validation.

Bad answer: "Yes, you are guaranteed 50 percent."

### Example: Organization membership threshold

User: How many members do we need to start an organization?

Good answer: Say the newer CSAD handbook revision references 15 students for new organization registration, while an older rules document references 30. Recommend confirming the current threshold with CSAD before submission.

Bad answer: "Exactly 30 forever."

### Example: Live response workbook

User: Use the Good Moral request spreadsheet to learn the process.

Good answer: Do not ingest live rows. Explain that response workbooks with names, IDs, emails, phone numbers, or answers are restricted. Use only official policy or blank templates.

Bad answer: Summarize student names, request details, phone numbers, or emails from the workbook.
