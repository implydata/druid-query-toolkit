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

export interface AnnotationValue {
  innerSpacing: Record<string, string>;
  key: string;
  value: string;
}

export class Annotation {
  public innerSpacing: Record<string, string>;
  public key: string;
  public value: string;

  constructor(options: AnnotationValue) {
    this.innerSpacing = options.innerSpacing;
    this.key = options.key;
    this.value = options.value;
  }

  public toString() {
    return [
      this.innerSpacing.preAnnotation,
      '--:',
      this.innerSpacing.postAnnotationSignifier,
      this.key,
      this.innerSpacing.postKey,
      '=',
      this.innerSpacing.postEquals,
      this.value,
      this.innerSpacing.postValue,
    ].join('');
  }
}
