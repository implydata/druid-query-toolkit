{
  function makeListMap(tail, index, head) {
    if(head === undefined){
      head = [];
    } else {
      head = [head];
    }
    return head.concat(tail.map(function(t) { return t[index] }));
  }

  function maybeMakeMulti(expressionType, head, tail) {
    if (!tail.length) return head;
    return new sql.SqlMulti({
      expressionType: expressionType,
      arguments: makeListMap(tail, 3, head),
      separators: makeSeparatorsList(tail),
    });
  }

  function makeSeparatorsList(tail) {
    return tail.map(function (t) {
      return new sql.Separator({
        left: t[0],
        separator: t[1],
        right: t[2],
      });
    });
  }
}
