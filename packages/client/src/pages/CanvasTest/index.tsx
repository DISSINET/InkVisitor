import TextCanvas from "components/basic/TextCanvas/TextCanvas";
import React, { useEffect, useRef } from "react";
import { LoremIpsum } from "lorem-ipsum";
import Canvas from "components/basic/TextCanvas/Canvas";

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
  const veryLongText = lorem.generateParagraphs(700);
  const myDivRef = useRef<HTMLCanvasElement>(null);

  // useEffect hook to run logic after the component is mounted
  useEffect(() => {
    // Initialize the CustomWrapper with the <div> element reference
    if (myDivRef.current) {
      const customWrapper = new Canvas(myDivRef.current);
      customWrapper.initialize()
      customWrapper.writeText(veryLongText)
    }


    // Cleanup logic if needed
    return () => {
      // Add cleanup logic here if needed
    };
  }, []); // Empty dependency array ensures that the effect runs only once after mount

  return (
    <div>
      <canvas ref={myDivRef} width="500" height="400" style={{ border: "1px solid black", margin: "5px" }} />
    </div>
  );
};

export default CanvasTestPage;
