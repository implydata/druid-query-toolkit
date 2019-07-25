export interface Alias {
  spacing: any[];
  value: any;
  keyword: string;
}

export class Alias {
  public spacing: any[];
  public value: any;
  public keyword: string;

  constructor(options: Alias) {
    this.keyword = options.keyword;
    this.value = options.value;
    this.spacing = options.spacing;
  }

  toString() {
    return this.keyword + this.spacing[0].join('') + this.value;
  }

  // addFilter(column: string, value: any): SqlQuery {
  //   // ToDo:
  // }
}
