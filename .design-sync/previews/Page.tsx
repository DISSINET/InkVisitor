import React from "react";
import { Page } from "dissinet.ddb.client";

// Page gates its children behind contentHeight/layoutWidth, both read from
// redux and both zero in the DS's empty store — real content never mounts,
// only <Loader show /> does, regardless of what children this preview passes.
// One cell is honest here: the shell (header chrome + loader) is the whole
// reachable state, not a missing effort on the children's part.
export const AppShell = () => (
  <Page>
    <div>Territory detail would render here once the layout has measured itself.</div>
  </Page>
);
