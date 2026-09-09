import React from "react";
import { Header, LeftHeader } from "dissinet.ddb.client";

// LeftHeader reads redux for the connection ping (defaults to "loading" with
// no store action dispatched) and its logo/version block is otherwise static,
// so tempLocation — used only on click, to restore the hash after a detour to
// another page — has no visible effect here. The variance worth showing is the
// header bar's own color, which Page picks per deployment environment.
export const Default = () => (
  <div style={{ width: 760 }}>
    <Header paddingY={0} paddingX={10} color="muni" left={<LeftHeader tempLocation={false} />} />
  </div>
);

export const StagingEnvironment = () => (
  <div style={{ width: 760 }}>
    <Header
      paddingY={0}
      paddingX={10}
      color="staging"
      left={<LeftHeader tempLocation="#T0-council-of-trent" />}
    />
  </div>
);
