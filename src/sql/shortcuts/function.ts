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

import { SqlExpression } from '../sql-expression';
import { SqlFunction } from '../sql-function/sql-function';
import { LiteralValue } from '../sql-literal/sql-literal';

export const F = function (name: string, ...args: (SqlExpression | LiteralValue)[]) {
  return SqlFunction.simple(name, args);
};

F.cast = SqlFunction.cast;
F.floor = SqlFunction.floor;
F.timeFloor = SqlFunction.timeFloor;
F.timeCeil = SqlFunction.timeCeil;
F.timeShift = SqlFunction.timeShift;
F.stringFormat = SqlFunction.stringFormat;
F.array = SqlFunction.array;
F.regexpLike = SqlFunction.regexpLike;

F.count = SqlFunction.count;
F.countDistinct = SqlFunction.countDistinct;
F.sum = SqlFunction.sum;
F.min = SqlFunction.min;
F.max = SqlFunction.max;
F.avg = SqlFunction.avg;

// ToDo: add way more functions here
