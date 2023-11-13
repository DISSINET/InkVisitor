import { MemoizedLoginModal } from "components/advanced";
import TextCanvas from "components/basic/TextCanvas/TextCanvas";
import React from "react";
import { LoremIpsum } from "lorem-ipsum";

interface ILoginPage {}

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

const CanvasTestPage: React.FC<ILoginPage> = ({}) => {
  const veryLongText = lorem.generateParagraphs(700);

  return (
    <div>
      <TextCanvas inputText={veryLongText} width={500} height={400} />
    </div>
  );
};

export default CanvasTestPage;
