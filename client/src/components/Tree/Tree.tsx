import React, { useState } from "react";
import { Tag, Button } from "components";
import { Entities, Node } from "types";

interface Tree {
  treeObject: Node;
  onNodeSelect?: Function;
  onNodeExpand?: Function;
  selectedTreeId?: string;
  expandedTreeId?: string;
}

export const Tree: React.FC<Tree> = ({
  treeObject,
  onNodeSelect,
  onNodeExpand,
  selectedTreeId,
  expandedTreeId,
}) => {
  const [expandedTreeNode, setExpandedTreeNode] = useState(treeObject);

  return (
    <div>
      <Tag
        entity={Entities.T}
        label={expandedTreeNode && expandedTreeNode.label}
      />
      <div className="flex flex-col">
        {expandedTreeNode.children.map((child: Node, key) => {
          return (
            <div className="flex my-1 ml-2" key={key}>
              <Tag
                entity={Entities.T}
                label={child && child.label}
                mode={child.id === selectedTreeId && "selected"}
                button={
                  <>
                    <Button
                      onClick={() => onNodeExpand && onNodeExpand(child.id)}
                      label=">"
                    />
                    <Button
                      onClick={() => onNodeSelect && onNodeSelect(child.id)}
                      label="O"
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
