import React from "react";

const PaginationContext = React.createContext({
  maxKeys: 10,
  onMaxKeysChange: () => {},
  nextContinuationToken: null,
  keyCount: 0,
  minPageKey: 1,
  maxPageKey: 0,
  pageHistoryIndex: 0,
  pageHistory: [],
  isNotEmpty: false,
});

export default PaginationContext;
