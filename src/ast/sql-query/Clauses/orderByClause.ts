import { OrExpression, String } from '../..';

export interface OrderByClauseValue {
  orderKeyword: string;
  byKeyword: string;
  orderBy: OrderByPart[];
  spacing: any[];
}

export class OrderByClause {
  public orderKeyword: string;
  public byKeyword: string;
  public orderBy: OrderByPart[];
  public spacing: any[];

  constructor(options: OrderByClauseValue) {
    this.orderBy = options.orderBy;
    this.orderKeyword = options.orderKeyword;
    this.byKeyword = options.byKeyword;
    this.spacing = options.spacing;
  }

  toString(): string {
    let val = [
      this.orderKeyword + this.spacing[0].join('') + this.byKeyword + this.spacing[1].join(''),
    ];
    this.orderBy.map((orderBy, index) => {
      val.push(orderBy.toString());
      if (index < this.spacing[2].length && this.spacing[2][index]) {
        val.push(',' + this.spacing[2][index].join(''));
      }
    });
    return val.join('');
  }

  getDirection(column: string): string {
    let direction: string = '';
    this.orderBy.map((part: any) => {
      if (part.getBasicValue() === column) {
        direction = part.direction;
      }
    });
    return direction;
  }

  getSorted() {
    const sorted: any[] = [];
    this.orderBy.map(part => {
      sorted.push({
        id: part.getBasicValue(),
        desc: part.direction,
      });
    });
    return sorted;
  }

  orderByColumn(column: string, direction: string | null) {
    const baseString = new String({ chars: column, quote: '"', spacing: [[''], ['']] });
    this.orderBy = [
      new OrderByPart({
        direction: direction,
        spacing: [[' ']],
        orderBy: new OrExpression({ basicExpression: baseString }),
      }),
    ];
  }
}

export interface OrderByPartValue {
  direction: string | null;
  orderBy: OrExpression;
  spacing: string[][];
}

export class OrderByPart {
  public direction: string | null;
  public orderBy: OrExpression;
  public spacing: string[][];

  constructor(options: OrderByPartValue) {
    this.direction = options.direction;
    this.orderBy = options.orderBy;
    this.spacing = options.spacing;
  }

  toString(): string {
    return this.orderBy.toString() + this.spacing[0].join('') + this.direction;
  }

  getBasicValue(): string {
    return this.orderBy.getBasicValue();
  }
}
