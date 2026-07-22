#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_MODELFILE="${ROOT_DIR}/Modelfile"
KNOWLEDGE_DIR="${ROOT_DIR}/docs/ai-knowledge"
OUTPUT_FILE="${1:-${ROOT_DIR}/Modelfile.generated}"

if [[ ! -f "${BASE_MODELFILE}" ]]; then
  echo "Missing base Modelfile: ${BASE_MODELFILE}" >&2
  exit 1
fi

if [[ ! -d "${KNOWLEDGE_DIR}" ]]; then
  echo "Missing knowledge directory: ${KNOWLEDGE_DIR}" >&2
  exit 1
fi

if grep -R '"""' "${KNOWLEDGE_DIR}" >/dev/null; then
  echo 'Knowledge files must not contain triple quotes ("""), because they would break the Modelfile SYSTEM block.' >&2
  exit 1
fi

last_line="$(tail -n 1 "${BASE_MODELFILE}")"
if [[ "${last_line}" != '"""' ]]; then
  echo 'Expected base Modelfile to end with a closing SYSTEM triple quote.' >&2
  exit 1
fi

tmp_file="$(mktemp)"
trap 'rm -f "${tmp_file}"' EXIT

head -n -1 "${BASE_MODELFILE}" > "${tmp_file}"

cat >> "${tmp_file}" <<'EOF'

Project Knowledge Pack:
The following knowledge pack is project-specific context for SAO-IS. Treat it as authoritative when it is more specific than the general behavior rules above. If any item is marked "Needs confirmation", do not present it as final policy; explain that SAO staff should confirm it.
EOF

knowledge_files=(
  "sao-centers.md"
  "document-types.csv"
  "workflow-policy.md"
  "approval-guidelines.md"
  "templates.md"
  "faq.md"
  "safety-rules.md"
  "examples.md"
  "glossary.md"
)

for file in "${knowledge_files[@]}"; do
  path="${KNOWLEDGE_DIR}/${file}"
  if [[ -f "${path}" ]]; then
    {
      echo
      echo "--- BEGIN ${file} ---"
      sed 's/[[:space:]]\+$//' "${path}"
      echo "--- END ${file} ---"
    } >> "${tmp_file}"
  fi
done

echo '"""' >> "${tmp_file}"
mv "${tmp_file}" "${OUTPUT_FILE}"
trap - EXIT

echo "Generated ${OUTPUT_FILE}"
echo "Build with: ollama create sao-is -f ${OUTPUT_FILE}"
