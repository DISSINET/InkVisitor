import api from "api";
import { useSearchParams } from "hooks";
import { useEffect } from "react";
import { useQuery } from "react-query";

const ScrollHandler = () => {
  const { statementId, territoryId } = useSearchParams();

  const { status: statementListStatus } = useQuery(
    ["territory", "statement-list", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    {
      enabled: !!territoryId && api.isLoggedIn(),
    }
  );
  const { status: treeStatus } = useQuery(
    ["tree"],
    async () => {
      const res = await api.treeGet();
      return res.data;
    },
    { enabled: api.isLoggedIn() }
  );

  useEffect(() => {
    if (statementListStatus === "success") {
      setTimeout(() => {
        const statementInTable = document.getElementById(
          `statement${statementId}`
        );
        const statementBox = document.getElementById(`Statements-box-table`);
        statementBox?.scrollTo({
          behavior: statementInTable ? "smooth" : "auto",
          top: statementInTable ? statementInTable.offsetTop - 34 : 0,
        });
      }, 200);
    }
  }, [statementId, statementListStatus]);

  useEffect(() => {
    if (treeStatus === "success") {
      setTimeout(() => {
        const territoryInTree = document.getElementById(
          `territory${territoryId}`
        );
        const territoryBox = document.getElementById(`Territories-box-content`);
        territoryBox?.scrollTo({
          behavior: territoryInTree ? "smooth" : "auto",
          top: territoryInTree ? territoryInTree.offsetTop - 103 : 0,
        });
      }, 200);
    }
  }, [territoryId, treeStatus]);

  return null;
};

export default ScrollHandler;
