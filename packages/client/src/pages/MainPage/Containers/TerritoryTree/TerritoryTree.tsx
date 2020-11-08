import React from "react";

import { Tag, Button } from "components";
import { Entities } from "types";
import { ResponseTerritoryI } from "@shared/types/response-territory";
import { TerritoryI } from "@shared/types";
import { useHistory } from "react-router-dom";

interface TerritoryTree {
  territory?: ResponseTerritoryI;
  fetchTerritory: (id: string) => void;
  setActiveStatementId: (id: string) => void;
}

export const TerritoryTree: React.FC<TerritoryTree> = ({
  territory,
  fetchTerritory,
  setActiveStatementId,
}) => {
  const history = useHistory();
  const territoryParent = territory && (territory.data.parent as string);

  return (
    <div>
      <div className="flex flex-col mt-1">
        <div className="mb-1">
          <h3>{"Selected territory: "}</h3>
          <Tag
            propId={territory?.id}
            category={Entities.T.id}
            color={Entities.T.color}
            label={territory?.data.label}
            invertedLabel
          />
        </div>
        {territoryParent && (
          <div className="">
            <h3>{"Parent territory: "}</h3>
            <Tag
              propId={territoryParent}
              category={Entities.T.id}
              color={Entities.T.color}
              label={territoryParent && territoryParent}
              button={
                territoryParent &&
                territoryParent.length > 0 && (
                  <Button
                    onClick={() => {
                      fetchTerritory(territoryParent);
                      history.push(`/${territoryParent}`);
                      setActiveStatementId("");
                    }}
                    label="<"
                  />
                )
              }
            />
          </div>
        )}
      </div>
      <div className="flex flex-col mt-1">
        {territory && territory.children && territory.children.length > 0 && (
          <h3>{"Children territories: "}</h3>
        )}
        {territory &&
          territory.children.map((child: TerritoryI, key) => {
            return (
              <div className="flex mb-1" key={key}>
                <Tag
                  propId={child.id}
                  category={Entities.T.id}
                  color={Entities.T.color}
                  label={child && child.data.label}
                  button={
                    <>
                      <Button
                        onClick={() => {
                          fetchTerritory(child.id);
                          history.push(`/${child.id}`);
                          setActiveStatementId("");
                        }}
                        label=">"
                      />
                    </>
                  }
                />
              </div>
            );
          })}
      </div>
    </div>
  );
};
