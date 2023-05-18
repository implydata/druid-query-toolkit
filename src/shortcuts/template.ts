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

import { RefName, SqlExpression, SqlLiteral } from '../sql';

export function sql(strings: TemplateStringsArray, ...xs: any[]): SqlExpression {
  const parts: string[] = strings.slice(0, 1);
  const n = xs.length;
  for (let i = 0; i < n; i++) {
    const x = xs[i];
    const before = strings[i]!;
    const beforeLastChar = before[before.length - 1];
    const after = strings[i + 1]!;
    const afterFirstChar = after[0];
    let toAdd: string;
    switch (beforeLastChar) {
      case '"': {
        // Detect ..."${x}"...
        if (afterFirstChar !== '"') {
          throw new Error(`the expression \`${x}\` is not evenly wrapped in double quotes`);
        }
        const str = RefName.create(String(x)).toString();
        toAdd = str.slice(1, str.length - 1);
        break;
      }

      case "'": {
        // Detect ...'${x}'...
        if (afterFirstChar !== "'") {
          throw new Error(`the literal \`${x}\` is not evenly wrapped in single quotes`);
        }
        const str = SqlLiteral.create(String(x)).toString();
        toAdd = str.slice(1, str.length - 1);
        break;
      }

      default:
        if (afterFirstChar === '"') {
          throw new Error(`the expression \`${x}\` is not evenly wrapped in double quotes`);
        }
        if (afterFirstChar === "'") {
          throw new Error(`the literal \`${x}\` is not evenly wrapped in single quotes`);
        }
        toAdd = SqlExpression.wrap(x).toString();
        break;
    }
    parts.push(toAdd, after);
  }

  return SqlExpression.parse(parts.join(''));
}
