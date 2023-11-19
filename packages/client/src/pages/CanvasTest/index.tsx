import TextCanvas from "components/basic/TextCanvas/TextCanvas";
import React from "react";
import { LoremIpsum } from "lorem-ipsum";

interface ILoginPage { }

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 40,
    min: 20,
  },
  wordsPerSentence: {
    max: 25,
    min: 10,
  },
});

const CanvasTestPage: React.FC<ILoginPage> = ({ }) => {
  const veryLongText = lorem.generateParagraphs(1);

  return (
    <div>
      <TextCanvas height={400} width={500} inputText={veryLongText} />
    </div>
  );
};

export default CanvasTestPage;
