<?php

namespace App\Services;

use App\Exceptions\UnsupportedDocumentTypeException;
use DateInterval;
use DateTimeInterface;
use OpenSpout\Reader\XLSX\Reader as XlsxReader;
use RuntimeException;
use Smalot\PdfParser\Parser as PdfParser;
use ZipArchive;

class DocumentTextExtractor
{
    private const PDF_MIME = 'application/pdf';
    private const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    private const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    private const IMAGE_MIMES = ['image/png', 'image/jpeg', 'image/jpg'];

    public function isImage(?string $mimeType, ?string $filename = null): bool
    {
        return in_array($this->normalizeMimeType($mimeType, $filename), self::IMAGE_MIMES, true);
    }

    public function isSupported(?string $mimeType, ?string $filename = null): bool
    {
        $mimeType = $this->normalizeMimeType($mimeType, $filename);

        return in_array($mimeType, [
            self::PDF_MIME,
            self::DOCX_MIME,
            self::XLSX_MIME,
            ...self::IMAGE_MIMES,
        ], true);
    }

    public function extract(string $path, ?string $mimeType = null, ?string $filename = null): string
    {
        $mimeType = $this->normalizeMimeType($mimeType ?: @mime_content_type($path) ?: null, $filename);

        return match ($mimeType) {
            self::PDF_MIME => $this->extractPdf($path),
            self::DOCX_MIME => $this->extractDocx($path),
            self::XLSX_MIME => $this->extractXlsx($path),
            default => throw new UnsupportedDocumentTypeException('This file type is not supported for text extraction.'),
        };
    }

    public function normalizeMimeType(?string $mimeType, ?string $filename = null): string
    {
        $mimeType = strtolower(trim((string) $mimeType));
        $extension = strtolower(pathinfo((string) $filename, PATHINFO_EXTENSION));

        return match (true) {
            $extension === 'pdf' => self::PDF_MIME,
            $extension === 'docx' => self::DOCX_MIME,
            $extension === 'xlsx' => self::XLSX_MIME,
            $extension === 'png' => 'image/png',
            in_array($extension, ['jpg', 'jpeg'], true) => 'image/jpeg',
            in_array($mimeType, ['image/jpg', 'image/jpeg'], true) => 'image/jpeg',
            $mimeType === 'application/x-pdf' => self::PDF_MIME,
            default => $mimeType,
        };
    }

    private function extractPdf(string $path): string
    {
        $parser = new PdfParser();
        $pdf = $parser->parseFile($path);

        return $this->compactText($pdf->getText());
    }

    private function extractDocx(string $path): string
    {
        $zip = new ZipArchive();

        if ($zip->open($path) !== true) {
            throw new RuntimeException('Unable to open DOCX file.');
        }

        try {
            $parts = ['word/document.xml'];

            for ($i = 0; $i < $zip->numFiles; $i++) {
                $name = $zip->getNameIndex($i);
                if (preg_match('/^word\/(?:header|footer)\d+\.xml$/', $name)) {
                    $parts[] = $name;
                }
            }

            $text = '';
            foreach (array_unique($parts) as $part) {
                $xml = $zip->getFromName($part);
                if ($xml === false) {
                    continue;
                }

                $text .= "\n" . $this->extractTextFromWordXml($xml);
            }

            return $this->compactText($text);
        } finally {
            $zip->close();
        }
    }

    private function extractTextFromWordXml(string $xml): string
    {
        $xml = preg_replace('/<w:tab\b[^>]*\/>/i', "\t", $xml);
        $xml = preg_replace('/<w:br\b[^>]*\/>/i', "\n", $xml);
        $xml = preg_replace('/<\/w:p>/i', "\n", $xml);
        $xml = preg_replace('/<\/w:tr>/i', "\n", $xml);
        $xml = preg_replace('/<\/w:tc>/i', "\t", $xml);

        return html_entity_decode(strip_tags($xml), ENT_QUOTES | ENT_XML1, 'UTF-8');
    }

    private function extractXlsx(string $path): string
    {
        $reader = new XlsxReader();
        $reader->open($path);

        try {
            $lines = [];
            $rowCount = 0;

            foreach ($reader->getSheetIterator() as $sheet) {
                $lines[] = 'Sheet: ' . $sheet->getName();

                foreach ($sheet->getRowIterator() as $row) {
                    $values = [];
                    foreach ($row->getCells() as $cell) {
                        $values[] = $this->formatSpreadsheetValue($cell->getValue());
                    }

                    if (array_filter($values, fn (string $value): bool => $value !== '') === []) {
                        continue;
                    }

                    $lines[] = $this->toCsvLine($values);
                    $rowCount++;

                    if ($rowCount >= 250 || strlen(implode("\n", $lines)) >= 15000) {
                        $lines[] = '[Truncated after 250 rows or 15000 characters]';
                        break 2;
                    }
                }
            }

            return $this->compactText(implode("\n", $lines));
        } finally {
            $reader->close();
        }
    }

    private function formatSpreadsheetValue(null|bool|DateInterval|DateTimeInterface|float|int|string $value): string
    {
        if ($value === null) {
            return '';
        }

        if ($value instanceof DateTimeInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        if ($value instanceof DateInterval) {
            return $value->format('%r%y years %m months %d days %h:%i:%s');
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        return trim((string) $value);
    }

    /**
     * @param array<int, string> $values
     */
    private function toCsvLine(array $values): string
    {
        return implode(',', array_map(function (string $value): string {
            if (str_contains($value, ',') || str_contains($value, '"') || str_contains($value, "\n")) {
                return '"' . str_replace('"', '""', $value) . '"';
            }

            return $value;
        }, $values));
    }

    private function compactText(string $text): string
    {
        $text = str_replace(["\r\n", "\r"], "\n", $text);
        $text = preg_replace('/[ \t]+/', ' ', $text);
        $text = preg_replace("/\n{3,}/", "\n\n", $text);

        return trim((string) $text);
    }
}
