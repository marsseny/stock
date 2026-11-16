import type { Spec } from '../types';
import csv from './product-specs.csv?raw';

/**
 * Per-project spec rows for the product page, read from `product-specs.csv`
 * (columns: slug, label, value — one row per line of the spec table, in display order).
 * Accepts comma- or semicolon-separated files (Google Sheets / Excel exports) with quoted values.
 */

function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const sep = firstLine.includes(';') && !firstLine.includes(',') ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else cell += ch;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

export const SPECS_BY_SLUG: Record<string, Spec[]> = (() => {
  const out: Record<string, Spec[]> = {};
  const [header, ...rows] = parseCsv(csv);
  if (!header) return out;
  const col = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);
  const [iSlug, iLabel, iValue] = [col('slug'), col('label'), col('value')];
  for (const r of rows) {
    const slug = r[iSlug]?.trim();
    const label = r[iLabel]?.trim();
    const value = r[iValue]?.trim();
    if (!slug || !label || !value) continue;
    (out[slug] ??= []).push({ label, value });
  }
  return out;
})();
