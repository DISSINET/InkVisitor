import api from "api";
import { useSearchParams } from "hooks";
import { useEffect } from "react";
import { useQuery } from "react-query";

const ScrollHandler = () => {
  const { statementId, territoryId } = useSearchParams();

  const { status } = useQuery(
    ["territory", "statement-list", territoryId],
    async () => {
      const res = await api.territoryGet(territoryId);
      return res.data;
    },
    {
      enabled: !!territoryId && api.isLoggedIn(),
      retry: 2,
    }
  );

  useEffect(() => {
    if (status === "success") {
      setTimeout(() => {
        const statementInTable = document.getElementById(
          `statement${statementId}`
        );
        const box = document.getElementById(`Statements-box-content`);
        box?.scrollTo({
          behavior: statementInTable ? "smooth" : "auto",
          top: statementInTable ? statementInTable.offsetTop : 0,
        });
      }, 200);
    }
  }, [statementId, status]);

  return null;
};

export default ScrollHandler;
