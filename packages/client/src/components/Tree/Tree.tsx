import React, { useState } from "react";
import { Tag, Button } from "components";
import { Entities, Node, TerritoriesTreeProps } from "types";

interface Tree {
  treeObject: Node;
  onNodeSelect?: Function;
  onNodeExpand?: Function;
  territoriesTreeProps: TerritoriesTreeProps;
}

export const Tree: React.FC<Tree> = ({
  treeObject,
  onNodeSelect,
  onNodeExpand,
  territoriesTreeProps,
}) => {
  const [prevNodeHistory, setPrevNodeHistory] = useState<Node[]>([treeObject]);

  const expandNode = (child: Node) => {
    // save new selected node to history
    setPrevNodeHistory([child, ...prevNodeHistory]);
    onNodeExpand && onNodeExpand(child.id);
  };

  const expandPrevNode = () => {
    // remove first node from history
    if (prevNodeHistory.length > 1) {
      const newHistory = prevNodeHistory.slice(1);
      setPrevNodeHistory(newHistory);
      onNodeExpand && onNodeExpand(newHistory[0].id);
    }
  };

  return (
    <div>
      <Tag
        category={Entities.T.id}
        color={Entities.T.color}
        label={prevNodeHistory[0] && prevNodeHistory[0].label}
        button={
          prevNodeHistory.length > 1 && (
            <Button onClick={() => expandPrevNode()} label="<" />
          )
        }
      />
      <div className="flex flex-col mt-1">
        {prevNodeHistory[0].children.map((child: Node, key) => {
          return (
            <div className="flex mb-1 ml-8" key={key}>
              <Tag
                category={Entities.T.id}
                color={Entities.T.color}
                label={child && child.label}
                mode={
                  child.id === territoriesTreeProps.selectedTreeId && "selected"
                }
                button={
                  <>
                    <Button
                      onClick={() => onNodeSelect && onNodeSelect(child.id)}
                      label="x"
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
