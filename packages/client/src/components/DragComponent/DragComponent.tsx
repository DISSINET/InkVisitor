import React from 'react'
import { DragSource, useDrag } from 'react-dnd'
// import { ItemTypes } from './Constants'

interface Card {
  isDragging?: boolean;
  text?: string;
}
/**
 * Your Component
 */
const Card: React.FC<Card> = ({ isDragging, text }) => {
  const [{ opacity }, dragRef] = useDrag({
    item: { id: 0, type: "TAG", text },
    collect: (monitor) => ({
      opacity: monitor.isDragging() ? 0.5 : 1,
    })
  })
  return (
    <div ref={dragRef} style={{ opacity, backgroundColor: "hotpink" }}>
      {text}
    </div>
  )
}

export default (Card);