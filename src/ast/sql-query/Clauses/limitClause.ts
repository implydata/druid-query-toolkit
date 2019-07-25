export interface LimitClauseValue {
  keyword: string;
  value: number[];
  spacing: string[][];
}

export class LimitClause {
  public keyword: string;
  public value: number[];
  public spacing: string[][];

  constructor(options: LimitClauseValue) {
    this.keyword = options.keyword;
    this.value = options.value;
    this.spacing = options.spacing;
  }

  toString(): string {
    let val: string[] = [this.keyword + this.spacing[0].join('')];
    this.value.map((limit, index: number) => {
      val.push(String(limit));
      if (index < this.value.length - 1) {
        val.push(',' + this.spacing[index].join(''));
      }
    });
    return val.join('');
  }
}
