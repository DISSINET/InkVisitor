export * from "./Cursor"
export * from "./Viewport"
export * from "./CanvasLib"

import { LoremIpsum } from "lorem-ipsum";

const exampleText = require("./example.txt");

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
export const example = exampleText.default;