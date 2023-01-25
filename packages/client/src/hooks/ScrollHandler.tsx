import api from "api";
import { useSearchParams } from "hooks";
import { useEffect } from "react";
import { useQuery } from "react-query";
import { useAppSelector } from "redux/hooks";

const ScrollHandler = () => {
  const { statementId, territoryId } = useSearchParams();

  const statementListOpened: boolean = useAppSelector(
    (state) => state.layout.statementListOpened
  );

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
  const { status: auditStatus, isFetching: isFetchingAudits } = useQuery(
    ["territory", "statement-list", "audits", territoryId, statementListOpened],
    async () => {
      const res = await api.auditsForStatements(territoryId);
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
    if (
      statementListStatus === "success" &&
      auditStatus === "success" &&
      !isFetchingStatementList &&
      !isFetchingAudits
    ) {
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
    }
  }, [
    statementId,
    statementListStatus,
    isFetchingStatementList,
    auditStatus,
    isFetchingAudits,
  ]);

  useEffect(() => {
    if (treeStatus === "success" && !isFetchingTree) {
      setTimeout(() => {
        const territoryInTree = document.getElementById(
          `territory${territoryId}`
        );
        const territoryBox = document.getElementById(`Territories-box-content`);

        if (territoryBox && territoryInTree) {
          territoryBox?.scrollTo({
            behavior: territoryInTree ? "smooth" : "auto",
            top: territoryInTree ? territoryInTree.offsetTop - 103 : 0,
          });
        }
      }, 200);
    }
  }, [territoryId, treeStatus, isFetchingTree]);

  return null;
};

export default ScrollHandler;
