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
  const [expandedTreeNode, setExpandedTreeNode] = useState(treeObject);
  const [prevNode, setPrevNode] = useState([]);

  const expandNode = (child: Node) => {
    // save current node to history
    // const newPrevNodeArr = prevNode.unshift(expandedTreeNode);
    // setPrevNode(newPrevNodeArr);
    // Expand clicked node
    onNodeExpand && onNodeExpand(child.id);
    setExpandedTreeNode(child);
  };

  // const expandPrevNode = () => {
  //   onNodeExpand && onNodeExpand(prevNode.shift().id);
  //   setExpandedTreeNode(prevNode);
  // };

  return (
    <div>
      <Tag
        entity={Entities.T}
        label={expandedTreeNode && expandedTreeNode.label}
        button={<Button onClick={() => expandNode(treeObject)} label="<" />}
      />
      <div className="flex flex-col mt-1">
        {expandedTreeNode.children.map((child: Node, key) => {
          return (
            <div className="flex mb-1 ml-8" key={key}>
              <Tag
                entity={Entities.T}
                label={child && child.label}
                mode={
                  child.id === territoriesTreeProps.selectedTreeId && "selected"
                }
                button={
                  <>
                    <Button
                      onClick={() => onNodeSelect && onNodeSelect(child.id)}
                      label="O"
                    />
                    {child.children.length > 0 && (
                      <Button onClick={() => expandNode(child)} label=">" />
                    )}
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
