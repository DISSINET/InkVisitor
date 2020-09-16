import React from "react";

import { Tag, Button } from "components";

import { StatementI, ResponseMetaI, ActantI } from "@shared/types";

interface StatementEditor {
  statement: undefined | StatementI;
  meta: ResponseMetaI;
  actants: ActantI[];
}

export const StatementEditor: React.FC<StatementEditor> = ({}) => {
  return <div />;
};
