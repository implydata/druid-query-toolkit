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

{
  function makeListMap(tail, index, head) {
    if (head === undefined) {
      head = [];
    } else {
      head = [head];
    }
    return head.concat(
      tail.map(function (t) {
        return t[index];
      }),
    );
  }

  function maybeMakeMulti(op, head, tail) {
    if (!tail.length) return head;
    return new S.SqlMulti({
      op: op,
      args: new S.SeparatedArray(makeListMap(tail, 3, head), makeSeparatorsList(tail)),
    });
  }

  function makeSeparatorsList(tail) {
    return tail.map(function (t) {
      return new S.Separator({
        left: t[0],
        separator: t[1],
        right: t[2],
      });
    });
  }

  function makeSeparatedArray(head, tail) {
    return new S.SeparatedArray(makeListMap(tail, 1, head), makeListMap(tail, 0));
  }

  function makeFunctionName(f) {
    return Array.isArray(f) ? S.RefName.functionName(f[1], true) : S.RefName.functionName(f);
  }
}
