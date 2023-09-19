import api from "api";
import { useSearchParams } from "hooks";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { setDisableStatementListScroll } from "redux/features/statementList/disableStatementListScrollSlice";
import { setDisableTreeScroll } from "redux/features/territoryTree/disableTreeScrollSlice";
import { useAppDispatch, useAppSelector } from "redux/hooks";

const ScrollHandler = () => {
  const { statementId, territoryId } = useSearchParams();

  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.statementListOpened
  );
  const disableStatementListScroll: boolean = useAppSelector(
    (state) => state.statementList.disableStatementListScroll
  );
  const disableTreeScroll: boolean = useAppSelector(
    (state) => state.territoryTree.disableTreeScroll
  );

  const dispatch = useAppDispatch();

  const { status: statementListStatus, isFetching: isFetchingStatementList } =
    useQuery(
      ["territory", "statement-list", territoryId, statementListOpened],
      async () => {
        const res = await api.territoryGet(territoryId);
        return res.data;
      },
      {
        enabled: !!territoryId && api.isLoggedIn() && statementListOpened,
      }
    );

  const { status: treeStatus, isFetching: isFetchingTree } = useQuery(
    ["tree"],
    async () => {
      const res = await api.treeGet();
      return res.data;
    },
    { enabled: api.isLoggedIn() }
  );

  useEffect(() => {
    if (statementListStatus === "success" && !isFetchingStatementList) {
      if (!disableStatementListScroll) {
        setTimeout(() => {
          const statementInTable = document.getElementById(
            `statement${statementId}`
          );
          const statementBox = document.getElementById(`Statements-box-table`);
          if (statementInTable && statementBox) {
            statementBox?.scrollTo({
              behavior: statementInTable ? "smooth" : "auto",
              top: statementInTable ? statementInTable.offsetTop - 34 : 0,
            });
          }
        }, 200);
      } else {
        dispatch(setDisableStatementListScroll(false));
      }
    }
  }, [statementId, statementListStatus, isFetchingStatementList]);

  useEffect(() => {
    if (treeStatus === "success" && !isFetchingTree) {
      if (!disableTreeScroll) {
        setTimeout(() => {
          const territoryInTree = document.getElementById(
            `territory${territoryId}`
          );
          const territoryBox = document.getElementById(
            `Territories-box-content`
          );

          // TODO: filter opened to choose scroll offset
          if (territoryBox && territoryInTree) {
            territoryBox?.scrollTo({
              behavior: territoryInTree ? "smooth" : "auto",
              top: territoryInTree ? territoryInTree.offsetTop - 103 : 0,
            });
          }
        }, 200);
      } else {
        dispatch(setDisableTreeScroll(false));
      }
    }
  }, [territoryId, treeStatus, isFetchingTree]);

  return null;
};

export default ScrollHandler;
