# SAO-IS AI Knowledge Pack

Last SharePoint source scan: 2026-07-09

This folder contains institutional, workflow, form, and policy-reference knowledge used to make the local SAO-IS Ollama model more accurate.

Primary source used for this update:

- SharePoint site: `https://livemcledu.sharepoint.com/sites/sao`
- Site title: Student Affairs Office
- Site description: Student Affairs Office
- Site last modified: 2026-07-09T14:32:47Z
- CSA subsite description: Center for Student Advising
- SAO-Related SPGs subsite description: current and draft SPGs related to SAO operations

Important: Ollama does not automatically read these files. After editing them, rebuild the generated Modelfile:

```bash
cd /home/joshu/SAO-IS
./scripts/build-ollama-modelfile.sh
ollama create sao-is -f Modelfile.generated
```

Then point Laravel to the custom model in `backend/.env`:

```env
OLLAMA_TEXT_MODEL=sao-is
OLLAMA_VISION_MODEL=sao-is
```

Run `php artisan config:clear` after changing `.env`.

## What Was Added

- Source-backed document/request type catalog from SharePoint List names and field definitions.
- Workflow hints from SharePoint form fields such as Adviser, CSAD, CSA, CSFA, SAO Director, CFO, EVP-COO, College Dean, and SAO Electoral Board.
- SPG policy anchors from the SAO-Related SPGs document library.
- Safer approval, request-info, and rejection guidance for AI-assisted recommendations.
- Privacy rules to avoid training on live student records, health declarations, discipline masterlists, grantee lists, and raw submitted forms.

## Accuracy Rules

- Do not include passwords, API keys, private student records, or live personal data.
- Use generic examples such as `Student Name` or `2026-00000`.
- Keep policies date-stamped if they may change.
- Mark items that require human confirmation instead of guessing.
- Keep financial assistance, disciplinary, health, counseling, and clearance guidance careful and non-final.
- Treat SharePoint form fields as metadata about expected intake fields, not as a final policy interpretation.

## File Map

- `source-inventory.md`: source scan summary, included and excluded SharePoint areas.
- `sao-centers.md`: center descriptions and escalation rules.
- `document-types.csv`: source of truth for document classification and requirements.
- `workflow-policy.md`: role and workflow routing rules.
- `approval-guidelines.md`: approve/reject/request-info guidance.
- `templates.md`: preferred tone and sample drafts.
- `faq.md`: student/staff/org officer FAQ.
- `safety-rules.md`: hard limits and do-not-say rules.
- `examples.md`: sample prompts and ideal outputs.
- `glossary.md`: local terms and acronyms.

<!-- second-sweep-20260710 -->

## Second Sweep Additions - 2026-07-10

The second SharePoint sweep added `policy-handbook-notes.md`, corrected center names in `sao-centers.md`, refreshed `glossary.md`, and expanded `document-types.csv` with additional scholarship, activity, organization, and reporting document types.

Use `policy-handbook-notes.md` as the highest-value compact source for handbook/SPG-derived rules. The sweep intentionally excluded a Good Moral request workbook because it contained live response rows and personal data.
