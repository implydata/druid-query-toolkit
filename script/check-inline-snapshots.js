/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// Checks that multi line inline snapshots are indented the way jest writes them: the content two
// spaces in from the line that has the matcher call and the closing backtick level with it.
// When jest updates any inline snapshot in a file it re-indents every inline snapshot in that file,
// and one indented less than that gets a whole extra indent, so a one line change turns into a
// diff of the whole file.
//
// Usage: node script/check-inline-snapshots.js [--fix]

const fs = require('fs');
const path = require('path');

const SNAPSHOT_REGEXP =
  /^([ \t]*)(.*(?:toMatchInlineSnapshot|toThrowErrorMatchingInlineSnapshot)\(\s*)`\n([\s\S]*?)\n[ \t]*`/gm;

function findSpecFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return findSpecFiles(entryPath);
    return entry.name.endsWith('.spec.ts') ? [entryPath] : [];
  });
}

function canonicalize(src) {
  let badCount = 0;
  const fixed = src.replace(SNAPSHOT_REGEXP, (match, indent, prefix, body) => {
    const lines = body.split('\n');
    const minIndent = Math.min(
      ...lines.filter(line => line.trim()).map(line => line.match(/^ */)[0].length),
    );
    const canonicalBody = lines
      .map(line => (line.trim() ? `${indent}  ${line.slice(minIndent)}` : ''))
      .join('\n');
    const canonical = `${indent}${prefix}\`\n${canonicalBody}\n${indent}\``;
    if (canonical !== match) badCount++;
    return canonical;
  });
  return { fixed, badCount };
}

const fix = process.argv.includes('--fix');
let total = 0;
for (const file of findSpecFiles('src')) {
  const { fixed, badCount } = canonicalize(fs.readFileSync(file, 'utf-8'));
  if (!badCount) continue;
  total += badCount;
  console.log(
    `${file}: ${badCount} inline snapshot(s) ${fix ? 'fixed' : 'not indented canonically'}`,
  );
  if (fix) fs.writeFileSync(file, fixed);
}

if (total && !fix) {
  console.log('Run `npm run snapshot-indent-fix` to fix them.');
  process.exit(1);
}
