export * from "./constants";
export * from "./Highlighter";
export * from "./Viewport";
export * from "./Text";
export * from "./Annotator";

import { LoremIpsum } from "lorem-ipsum";

const lorem = new LoremIpsum({
  // one page = 500 words
  sentencesPerParagraph: {
    max: 20,
    min: 20,
  },
  wordsPerSentence: {
    max: 25,
    min: 25,
  },
});

export const generateText = lorem.generateParagraphs.bind(lorem);
