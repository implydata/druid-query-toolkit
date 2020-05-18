{
  function makeListMap(tail, index, head) {
    if(head === undefined){
      head = [];
    } else {
      head = [head];
    }
    return head.concat(tail.map(function(t) { return t[index] }));
  }

  function makeSeparatorsList(tail) {
    return (tail.map(function (t) {
      return new sql.Separator({
        left: t[0],
        right: t[2],
        separator: t[1],
      });
    }));
  }

  function makeEscapedSeparatorsList(tail) {
    return (tail.map(function(t) {
      return new sql.Separator({
        left: t[0],
        right: t[3],
        separator: t[1],
      });
    }));
  }
}
