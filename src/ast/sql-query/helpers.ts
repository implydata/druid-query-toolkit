export function renderOpenParens(parens: parens[]): string {
  const val: string[] = [];
  if (parens) {
    parens.map(paren => {
      val.push(paren.open[0] + paren.open[1].join(''));
    });
  }
  return val.join('');
}

export function renderCloseParens(parens: parens[]): string {
  const val: string[] = [];
  if (parens) {
    parens.map(paren => {
      val.push(paren.close[0].join('') + paren.close[1]);
    });
  }
  return val.join('');
}

export interface parens {
  open: (string[][] | string[])[];
  close: (string[][] | string[])[];
}
