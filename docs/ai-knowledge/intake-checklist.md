# AI Knowledge Intake Checklist

Last updated from SharePoint: 2026-07-09

Use this checklist to keep improving SAO-IS AI accuracy.

## Step 1: Confirm Center Scope

Current source-backed notes:

- SAO root site: Student Affairs Office.
- CSA subsite: Center for Student Advising.
- CSAD appears in activity, organization, good moral, and discipline-related form metadata.
- CSFA appears in scholarship, discount, and study-aid form metadata.
- Guidance Services is represented by SPG 060; confirm current CGC mapping.

Update: `sao-centers.md`

## Step 2: Build the Document Type Catalog

Completed from SharePoint List metadata on 2026-07-09:

- Good Moral Character Certificate.
- Student Activity Form.
- Off-Campus Activity Form.
- Fund Raising Activity Form.
- Organization renewal, advisorship, authorization, biodata, and candidacy forms.
- Scholarship application, validation, sibling discount, and study-aid forms.
- Advising and peer mentoring forms.
- Student infraction and letter of explanation forms.
- General SAO requirement submission forms.

Update: `document-types.csv`

## Step 3: Define Workflow Rules

Completed from metadata:

- Adviser, CSAD, CSFA, CSA, SAO, SAO Director, CFO, EVP-COO, HRMO Manager, College Dean, and SAO Electoral Board fields were captured as workflow hints.

Update: `workflow-policy.md`

## Step 4: Define Approval Guidance

Completed:

- Added document-specific completeness hints for good moral, student activity, fund raising, scholarship validation, sibling discount, discipline/letter of explanation, and advising/peer mentoring.

Update: `approval-guidelines.md`

## Step 5: Add Tone and Templates

Completed:

- Added request-info templates for good moral, student activity, fund raising, scholarship validation, sibling discount, discipline, and advising/peer mentoring.

Update: `templates.md`

## Step 6: Add FAQs

Completed:

- Added FAQ entries for good moral, activities, CSA/advising, scholarships, and privacy-safe training.

Update: `faq.md`

## Step 7: Add Safety Rules

Completed:

- Added restrictions against using live student records, health declarations, discipline masterlists, grantee lists, and raw submitted forms.

Update: `safety-rules.md`

## Step 8: Add Test Examples

Completed:

- Added classification, workflow, approval recommendation, discipline deferral, and Tagalog accessibility examples.

Update: `examples.md`

## Step 9: Human Confirmation Still Needed

Ask SAO staff to confirm:

- Whether `CSA` should be treated as Center for Student Advising in SAO-IS labels.
- Whether CSAD is the active owner for all activity and organization forms.
- Current official turnaround times.
- Current active SPG revisions and whether draft SPGs should be used.
- Active workflow steps in SAO-IS, especially CFO/EVP-COO, HRMO Manager, and SAO Electoral Board mappings.

## Step 10: Rebuild the Model

After editing the files:

```bash
cd /home/joshu/SAO-IS
./scripts/build-ollama-modelfile.sh
ollama create sao-is -f Modelfile.generated
cd backend && php artisan config:clear
```

Then test:

```bash
ollama run sao-is
```

<!-- second-sweep-20260710 -->

## Second Sweep Intake Prompts - 2026-07-10

### Activity or organization request

Ask for: activity or organization name, organizer, adviser, student organization status, activity type, date and time, venue or platform, participant group, budget, fund source, whether off-campus or online, whether fund raising is involved, and what forms have already been submitted.

### Scholarship or financial aid request

Ask for: scholarship or discount name, school year or term, student level, program or strand, notice received, current scholarships or external aid, available documents, parent or guardian availability for undertaking, and any deadline stated by CSFA.

### Discipline or misconduct request

Ask for: date, location or platform, people involved, role of the requester, official notice or report number if any, documents received, and whether the user needs routing, explanation of process, or emergency support. Do not ask for unnecessary sensitive details.
