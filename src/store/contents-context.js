import React from "react";

const ContentsContext = React.createContext({
  breadcrumbs: [],
  buckets: [],
  folders: [],
  files: [],
});

export default ContentsContext;
