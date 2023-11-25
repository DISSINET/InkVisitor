import TextCanvas from "components/basic/TextCanvas/TextCanvas";
import React, { useEffect } from "react";
import { LoremIpsum } from "lorem-ipsum";

interface ILoginPage {}

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

const CanvasTestPage: React.FC<ILoginPage> = ({}) => {
  const veryLongText = lorem.generateParagraphs(1000);

  return (
    <div>
      <TextCanvas height={400} width={500} inputText={veryLongText} />
    </div>
  );
};

export default CanvasTestPage;
