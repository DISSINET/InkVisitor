import React, { useState, useEffect } from "react";

import { Tag, Button } from "components";
import { Entities, Node } from "types";
import { ResponseTerritoryI } from "@shared/types/response-territory";
import { TerritoryI } from "@shared/types";

interface Tree {
  territory?: ResponseTerritoryI;
  fetchTerritory: (id: string) => void;
}

export const Tree: React.FC<Tree> = ({ territory, fetchTerritory }) => {
  const territoryParent = territory && (territory.data.parent as string);

  return (
    <div>
      <Tag
        category={Entities.T.id}
        color={Entities.T.color}
        label={territory && territory.label}
        button={
          territoryParent &&
          territoryParent.length > 0 && (
            <Button onClick={() => fetchTerritory(territoryParent)} label="<" />
          )
        }
      />
      <div className="flex flex-col mt-1">
        {territory &&
          territory.children.map((child: TerritoryI, key) => {
            return (
              <div className="flex mb-1 ml-8" key={key}>
                <Tag
                  category={Entities.T.id}
                  color={Entities.T.color}
                  label={child && child.label}
                  button={
                    <>
                      <Button
                        onClick={() => {
                          fetchTerritory(child.id);
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
