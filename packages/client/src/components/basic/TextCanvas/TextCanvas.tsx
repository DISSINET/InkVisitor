// TextCanvas.tsx
import React, { useState, useRef, useEffect } from 'react';

interface TextCanvasProps {
    text: string;
    width: number;
    height: number;
}

const TextCanvas: React.FC<TextCanvasProps> = ({ text, width, height }) => {
    const [cursorPosition, setCursorPosition] = useState<number>(0);
    const [currentText, setCurrentText] = useState<string>(text);
    const [offsetY, setOffsetY] = useState<number>(0);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const lineHeight = 20;
    const charsPerLine = Math.floor(width / 10); 

    useEffect(() => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');

            ctx!.clearRect(0, 0, width, height);
            ctx!.font = "16px Monospace";

            const lines = splitTextIntoLines(currentText, charsPerLine);
            lines.slice(offsetY, offsetY + height / lineHeight).forEach((line, index) => {
                ctx!.fillText(line, 10, (index + 1) * lineHeight);
            });

            const cursorLine = Math.floor(cursorPosition / charsPerLine) - offsetY;
            const cursorChar = cursorPosition % charsPerLine;
            if (cursorLine >= 0 && cursorLine < height / lineHeight) {
                ctx!.fillRect(cursorChar * 10, cursorLine * lineHeight, 2, lineHeight);
            }
        }
    }, [currentText, cursorPosition, offsetY]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
        e.preventDefault();
        switch (e.key) {
            


            case 'ArrowUp':
                setCursorPosition(pos => Math.max(0, pos - charsPerLine));
                break;
            case 'ArrowDown':
                setCursorPosition(pos => Math.min(currentText.length, pos + charsPerLine));
                break;
            case 'ArrowLeft':
                setCursorPosition(pos => Math.max(0, pos - 1));
                break;
            case 'ArrowRight':
                setCursorPosition(pos => Math.min(currentText.length, pos + 1));
                break;
            default:
                // Simple handling for text input and deletion. Can be expanded.
                if (e.key.length === 1) {
                    setCurrentText(prevText => 
                        prevText.slice(0, cursorPosition) + e.key + prevText.slice(cursorPosition));
                    setCursorPosition(pos => pos + 1);
                } else if (e.key === 'Backspace') {
                    setCurrentText(prevText => 
                        prevText.slice(0, cursorPosition - 1) + prevText.slice(cursorPosition));
                    setCursorPosition(pos => Math.max(0, pos - 1));
                }
                break;
        
        }
    }

    return (
        <div>
            <button onClick={() => setOffsetY(y => Math.max(0, y - 1))}>Move Up</button>
            <button onClick={() => setOffsetY(y => y + 1)}>Move Down</button>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onKeyDown={handleKeyDown}
                tabIndex={0}
                style={{ border: '1px solid black', marginTop: '10px' }}
            ></canvas>
        </div>
    );
}

const splitTextIntoLines = (text: string, charsPerLine: number): string[] => {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
        if (currentLine.length + word.length <= charsPerLine) {
            currentLine += (currentLine ? ' ' : '') + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines;
}

export default TextCanvas;
