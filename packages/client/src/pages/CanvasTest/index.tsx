import { MemoizedLoginModal } from "components/advanced";
import TextCanvas from "components/basic/TextCanvas/TextCanvas";
import React from "react";

interface ILoginPage { }

const generateRandomText = (length: number): string => {
    const characters = 'abcdefghijklmnopqrstuvwxyz ';
    let text = '';
    let wordLengthCounter = 0;
    let sentenceLengthCounter = 0;

    for (let i = 0; i < length; i++) {
        const char = characters.charAt(Math.floor(Math.random() * characters.length));
        text += char;

        if (char !== ' ') {
            wordLengthCounter++;
            sentenceLengthCounter++;
        } else {
            wordLengthCounter = 0;
        }

        // Insert occasional punctuation and reset the sentence counter
        if (sentenceLengthCounter > 50 && Math.random() < 0.1) {
            text += '.';
            sentenceLengthCounter = 0;
        }

        // Cap word length to 10 characters
        if (wordLengthCounter > 10) {
            text += ' ';
            wordLengthCounter = 0;
        }
    }
    return text;
}

const CanvasTestPage: React.FC<ILoginPage> = ({ }) => {
  const veryLongText = generateRandomText(200000)
  
  return <div>
    <TextCanvas text={veryLongText} width={500} height={400} />
  </div>;
};

export default CanvasTestPage;
