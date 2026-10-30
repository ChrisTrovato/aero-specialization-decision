import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

// Validate the authored research and deployable assets without running the UI.
// Browser behavior and visual accessibility still require a separate UI review.
const project = path.dirname(fileURLToPath(import.meta.url));
const dist = path.join(project, 'dist');
const failures = [];
let checkedReferences = 0;
let checkedUrls = 0;
let checkedPrivacyFields = 0;
const fail = (where, message) => failures.push(`${where}: ${message}`);
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const requiredText = (record, fields, where) => {
  for (const field of fields) {
    if (!nonempty(record?.[field])) fail(`${where}.${field}`, 'expected nonempty text');
  }
};
const requiredTextArray = (record, field, where) => {
  if (!Array.isArray(record?.[field]) || record[field].length === 0) {
    fail(`${where}.${field}`, 'expected a nonempty list');
    return;
  }
  record[field].forEach((entry, index) => {
    if (!nonempty(entry)) fail(`${where}.${field}[${index}]`, 'expected nonempty text');
  });
};

function read(file) {
  try {
    return fs.readFileSync(path.join(dist, file), 'utf8');
  } catch (error) {
    fail(file, `cannot read deployable file (${error.code || error.name})`);
    return '';
  }
}

function httpsUrl(value, where) {
  checkedUrls++;
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || !parsed.hostname) {
      fail(where, 'external source/company URLs must use HTTPS');
    }
    if (parsed.username || parsed.password) fail(where, 'URL contains embedded credentials');
  } catch {
    fail(where, 'invalid absolute URL');
  }
}

function uniqueIds(records, where) {
  const found = new Set();
  records.forEach((record, index) => {
    const id = record?.id;
    if (!nonempty(id)) return fail(`${where}[${index}].id`, 'missing identifier');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      fail(`${where}[${index}].id`, 'identifier must be a lowercase alphanumeric slug');
    }
    if (found.has(id)) fail(where, `duplicate identifier ${id}`);
    found.add(id);
  });
  return found;
}

const privateThreadIds = [
  '01a1885f-0cdb-76f1-b2a6-37ca0fe5d08f',
  '01a189e3-a11a-7eb0-be0f-d6b8337350b8',
  '01a18a2e-9ff0-76e0-80d7-c30a7cd1c12b',
  '01a18155-b1a4-7b12-9860-4491fcb7d007'
];

function privacy(value, where) {
  checkedPrivacyFields++;
  // Match actual addresses, not CSS @media, annotations, handles or lone @ signs.
  if (/\b[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?)+\b/i.test(value)) {
    fail(where, 'contains an email address; review before publication (value redacted)');
  }
  if (/(?:[a-z]:[\\/]+Users[\\/]|\/(?:Users|home)\/|file:\/\/|Documents[\\/]Codex[\\/]|\.codex[\\/]attachments)/i.test(value)) {
    fail(where, 'contains a local home/workspace or attachment path (value redacted)');
  }
  if (/(?:thread:\/\/|codex:\/\/threads\/|requestedThreadId|"threadId"\s*:)/i.test(value) ||
      privateThreadIds.some(id => value.includes(id))) {
    fail(where, 'contains a private chat reference (value redacted)');
  }
}

function walk(value, where, sourceIds) {
  if (typeof value === 'string') {
    privacy(value, where);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => walk(entry, `${where}[${index}]`, sourceIds));
    return;
  }
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${where}.${key}`;
    if (key === 'sourceIds') {
      if (!Array.isArray(child) || child.length === 0) fail(childPath, 'expected source references');
      else child.forEach((id, index) => {
        checkedReferences++;
        if (!sourceIds.has(id)) fail(`${childPath}[${index}]`, `unresolved source ${String(id)}`);
      });
    }
    if (key === 'sourceId') {
      checkedReferences++;
      if (!sourceIds.has(child)) fail(childPath, `unresolved source ${String(child)}`);
    }
    if (/url$/i.test(key) && typeof child === 'string') httpsUrl(child, childPath);
    if (/^(?:threadId|hostId|chatId)$/i.test(key)) fail(childPath, 'private conversation metadata');
    walk(child, childPath, sourceIds);
  }
}

const context = vm.createContext({ window: {} }, {
  name: 'frontier-atlas-research-check',
  codeGeneration: { strings: false, wasm: false }
});
for (const file of ['data.js', 'editorial.js']) {
  const code = read(file);
  if (!code) continue;
  try {
    new vm.Script(code, { filename: file }).runInContext(context, { timeout: 2000 });
  } catch (error) {
    fail(file, `data script cannot be evaluated: ${error.message}`);
  }
}

const research = context.window.RESEARCH;
const editorial = context.window.EDITORIAL;
if (!research || typeof research !== 'object') fail('data.js', 'window.RESEARCH is missing');
if (!editorial || typeof editorial !== 'object') fail('editorial.js', 'window.EDITORIAL is missing');
const specialties = Array.isArray(research?.specialties) ? research.specialties : [];
const researchSources = Array.isArray(research?.sources) ? research.sources : [];
const editorialSources = Array.isArray(editorial?.sources) ? editorial.sources : [];
const sources = [...researchSources, ...editorialSources];
if (specialties.length !== 26) fail('RESEARCH.specialties', `expected 26 specialties; found ${specialties.length}`);
if (!researchSources.length) fail('RESEARCH.sources', 'no research evidence records');
if (!editorialSources.length) fail('EDITORIAL.sources', 'no editorial evidence records');
uniqueIds(specialties, 'specialties');
const sourceIds = uniqueIds(sources, 'sources');

sources.forEach((source, index) => {
  requiredText(source, ['id', 'title', 'url', 'claim'], `sources[${index}]`);
});
specialties.forEach((specialty, index) => {
  const where = `specialties[${index}](${specialty?.id || '?'})`;
  requiredText(specialty, [
    'id', 'title', 'domain', 'hook', 'work', 'degrees', 'outlook2034',
    'outlook2040', 'confidence', 'spaceflight', 'starterProject'
  ], where);
  for (const field of ['niches', 'skills', 'pros', 'cons', 'sourceIds']) {
    requiredTextArray(specialty, field, where);
  }
  if (!Array.isArray(specialty?.companies) || specialty.companies.length === 0) {
    fail(`${where}.companies`, 'expected at least one sourced employer example');
  } else specialty.companies.forEach((company, companyIndex) => {
    requiredText(company, ['name', 'url', 'why'], `${where}.companies[${companyIndex}]`);
  });
});
walk(research, 'RESEARCH', sourceIds);
walk(editorial, 'EDITORIAL', sourceIds);

const html = read('index.html');
privacy(html, 'index.html');
if (!/<html\b[^>]*\blang\s*=\s*["']en["']/i.test(html)) fail('index.html', 'English document language is missing');
if (!/<title>[^<]+<\/title>/i.test(html)) fail('index.html', 'document title is missing');
if (!/<main\b/i.test(html)) fail('index.html', 'main content landmark is missing');
const htmlIds = [...html.matchAll(/\bid\s*=\s*["']([^"']+)["']/g)].map(match => match[1]);
const usedHtmlIds = new Set();
for (const id of htmlIds) {
  if (usedHtmlIds.has(id)) fail('index.html', `duplicate DOM id ${id}`);
  usedHtmlIds.add(id);
}

const scriptRefs = [...html.matchAll(/<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi)].map(match => match[1]);
const styleRefs = [...html.matchAll(/<link\b[^>]*>/gi)].map(match => match[0])
  .filter(tag => /\brel\s*=\s*["']stylesheet["']/i.test(tag))
  .map(tag => /\bhref\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]).filter(Boolean);
if (!scriptRefs.includes('data.js') || !scriptRefs.includes('editorial.js') || !scriptRefs.includes('app.js')) {
  fail('index.html', 'must load data.js, editorial.js and app.js');
}
if (scriptRefs.indexOf('app.js') <= scriptRefs.indexOf('data.js') ||
    scriptRefs.indexOf('app.js') <= scriptRefs.indexOf('editorial.js')) {
  fail('index.html', 'app.js must load after its research data');
}
if (!styleRefs.length) fail('index.html', 'no stylesheet linked');

for (const ref of [...scriptRefs, ...styleRefs]) {
  if (/^(?:https?:)?\/\//i.test(ref)) {
    httpsUrl(ref, `index.html asset ${ref}`);
    continue;
  }
  const clean = decodeURIComponent(ref.split(/[?#]/)[0]);
  const absolute = path.resolve(dist, clean);
  if (!absolute.startsWith(dist + path.sep)) {
    fail('index.html', `asset escapes the deployable folder: ${ref}`);
    continue;
  }
  let content;
  try { content = fs.readFileSync(absolute, 'utf8'); }
  catch (error) {
    fail('index.html', `missing linked asset ${ref} (${error.code || error.name})`);
    continue;
  }
  if (!content.trim()) fail(ref, 'linked asset is empty');
  privacy(content, ref);
  if (/\.js$/i.test(clean)) {
    try { new vm.Script(content, { filename: ref }); }
    catch (error) { fail(ref, `JavaScript syntax error: ${error.message}`); }
  }
}

if (failures.length) {
  console.error(`Frontier Atlas validation failed (${failures.length} issue${failures.length === 1 ? '' : 's'}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`PASS: ${specialties.length} specialties; ${sources.length} unique sources; ${checkedReferences} resolved citations; ${checkedUrls} HTTPS URLs.`);
  console.log(`PASS: linked scripts/styles exist, JavaScript parses, document landmarks and static DOM IDs checked.`);
  console.log(`PASS: ${checkedPrivacyFields} text fields/assets scanned; no email addresses, local home paths, or private chat references found.`);
  console.log('Limit: static checks do not verify browser interactions, visual layout, or the continued availability of remote links.');
}
