import React from "react";
import { PaginationControls } from "dissinet.ddb.client";

// Used at the foot of a paginated child-territory list or inverse-relation
// group; only currentPage/totalPages/callbacks exist, so the variant axis is
// just where in the run the current page sits.
export const MidRun = () => (
  <PaginationControls currentPage={3} totalPages={12} onPreviousPage={() => {}} onNextPage={() => {}} />
);

export const FirstPage = () => (
  <PaginationControls currentPage={1} totalPages={5} onPreviousPage={() => {}} onNextPage={() => {}} />
);

export const LastPage = () => (
  <PaginationControls currentPage={8} totalPages={8} onPreviousPage={() => {}} onNextPage={() => {}} />
);
