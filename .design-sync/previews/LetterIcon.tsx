import React from "react";
import { LetterIcon } from "dissinet.ddb.client";

const Row: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
    {children}
  </div>
);

export const Default = () => <LetterIcon letter="T" bgColor="entityT" color="white" />;

export const EntityClassSweep = () => (
  <Row>
    <LetterIcon letter="T" bgColor="entityT" color="white" />
    <LetterIcon letter="R" bgColor="entityR" color="white" />
    <LetterIcon letter="A" bgColor="entityA" color="white" />
    <LetterIcon letter="S" bgColor="entityS" color="white" />
    <LetterIcon letter="C" bgColor="entityC" color="white" />
    <LetterIcon letter="E" bgColor="entityE" color="white" />
    <LetterIcon letter="G" bgColor="entityG" color="white" />
    <LetterIcon letter="L" bgColor="entityL" color="white" />
  </Row>
);

export const SizeSweep = () => (
  <Row>
    <LetterIcon letter="T" bgColor="entityT" color="white" size={12} />
    <LetterIcon letter="T" bgColor="entityT" color="white" size={16} />
    <LetterIcon letter="T" bgColor="entityT" color="white" size={24} />
    <LetterIcon letter="T" bgColor="entityT" color="white" size={32} />
  </Row>
);

// Unfilled: no bgColor, dark letter on a transparent field — used where the
// glyph sits on an already-colored parent (e.g. the entity tag's class chip).
export const NoBackground = () => <LetterIcon letter="C" color="black" size={20} />;
