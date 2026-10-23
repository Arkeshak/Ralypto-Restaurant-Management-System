import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const localesDir = path.resolve(__dirname, '../src/i18n/locales');
const enPath = path.join(localesDir, 'en.json');
const siPath = path.join(localesDir, 'si.json');
const taPath = path.join(localesDir, 'ta.json');

function flattenKeys(obj, prefix = '') {
  let keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys = keys.concat(flattenKeys(v, fullKey));
    } else {
      keys.push({ key: fullKey, value: v });
    }
  }
  return keys;
}

function getValue(obj, keyPath) {
  const parts = keyPath.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === undefined || cur === null) return undefined;
    cur = cur[p];
  }
  return cur;
}

try {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const si = JSON.parse(fs.readFileSync(siPath, 'utf8'));
  const ta = JSON.parse(fs.readFileSync(taPath, 'utf8'));

  const enEntries = flattenKeys(en);
  const totalKeys = enEntries.length;

  console.log(`[i18n:check] Checking ${totalKeys} keys from en.json...`);

  let missingSi = [];
  let missingTa = [];

  for (const { key } of enEntries) {
    const valSi = getValue(si, key);
    if (valSi === undefined || valSi === null || (typeof valSi === 'string' && valSi.trim() === '')) {
      missingSi.push(key);
    }

    const valTa = getValue(ta, key);
    if (valTa === undefined || valTa === null || (typeof valTa === 'string' && valTa.trim() === '')) {
      missingTa.push(key);
    }
  }

  const siPercent = (((totalKeys - missingSi.length) / totalKeys) * 100).toFixed(1);
  const taPercent = (((totalKeys - missingTa.length) / totalKeys) * 100).toFixed(1);

  console.log(`[i18n:check] Sinhala (si): ${totalKeys - missingSi.length}/${totalKeys} translated (${siPercent}%)`);
  console.log(`[i18n:check] Tamil   (ta): ${totalKeys - missingTa.length}/${totalKeys} translated (${taPercent}%)`);

  if (missingSi.length > 0 || missingTa.length > 0) {
    if (missingSi.length > 0) {
      console.error(`\n❌ Missing or empty keys in si.json (${missingSi.length}):\n` + missingSi.slice(0, 10).map((k) => `  - ${k}`).join('\n') + (missingSi.length > 10 ? `\n  ... and ${missingSi.length - 10} more` : ''));
    }
    if (missingTa.length > 0) {
      console.error(`\n❌ Missing or empty keys in ta.json (${missingTa.length}):\n` + missingTa.slice(0, 10).map((k) => `  - ${k}`).join('\n') + (missingTa.length > 10 ? `\n  ... and ${missingTa.length - 10} more` : ''));
    }
    process.exit(1);
  }

  console.log('\n✅ All i18n keys are 100% matched across en.json, si.json, and ta.json!\n');
  process.exit(0);
} catch (err) {
  console.error('[i18n:check] Error running check:', err);
  process.exit(1);
}
