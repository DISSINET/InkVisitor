import { Annotator } from "@inkvisitor/annotator/src/lib";
import { UserEnums } from "@shared/enums";
import {
  IEntity,
  IResponseGeneric,
  IResponseStatement,
  IStatement,
} from "@shared/types";
import { UseMutationResult } from "@tanstack/react-query";
import { AxiosResponse } from "axios";
import TextAnnotator from "components/advanced/Annotator/Annotator";
import AnnotatorProvider from "components/advanced/Annotator/AnnotatorProvider";
import { useSearchParams } from "hooks";
import React from "react";
import { CellProps } from "react-table";
import { useAppDispatch, useAppSelector } from "redux/hooks";

type CellType = CellProps<IResponseStatement>;

interface StatementListTextAnnotator {
  statements: IResponseStatement[];
  handleRowClick?: (rowId: string) => void;
  actantsUpdateMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric>,
    unknown,
    {
      statementId: string;
      data: {};
    },
    unknown
  >;
  entities: { [key: string]: IEntity };
  right: UserEnums.RoleMode;

  cloneStatementMutation: UseMutationResult<
    AxiosResponse<IResponseGeneric<any>>,
    unknown,
    string,
    unknown
  >;
  setStatementToDelete: React.Dispatch<
    React.SetStateAction<IStatement | undefined>
  >;
  setShowSubmit: React.Dispatch<React.SetStateAction<boolean>>;
  addStatementAtCertainIndex: (index: number) => Promise<void>;

  selectedRows: string[];
  setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;
}
export const StatementListTextAnnotator: React.FC<
  StatementListTextAnnotator
> = ({
  statements,
  handleRowClick = () => {},
  actantsUpdateMutation,
  entities,
  right,

  cloneStatementMutation,
  setStatementToDelete,
  setShowSubmit,
  addStatementAtCertainIndex,

  selectedRows,
  setSelectedRows,
}) => {
  const dispatch = useAppDispatch();

  const panelWidths: number[] = useAppSelector(
    (state) => state.layout.panelWidths
  );

  const { territoryId, setStatementId } = useSearchParams();

  console.log(panelWidths);

  return (
    <div>
      <div>First line</div>
      <AnnotatorProvider>
        <TextAnnotator
          width={panelWidths[2]}
          displayLineNumbers={true}
          height={500}
        />
      </AnnotatorProvider>
    </div>
  );
};
