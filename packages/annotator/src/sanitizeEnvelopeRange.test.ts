/**
 * Tests for sanitizeEnvelopeRange method
 * 
 * This test file covers various scenarios for the sanitizeEnvelopeRange method
 * to ensure it properly handles XML tag structure when adding new anchor tags.
 */

import { Annotator } from './lib/Annotator';

// Mock HTMLCanvasElement for testing
const createMockCanvas = (): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.style.width = '800px';
  canvas.style.height = '600px';
  return canvas;
};

describe('sanitizeEnvelopeRange', () => {
  let annotator: Annotator;
  let mockCanvas: HTMLCanvasElement;

  beforeEach(() => {
    mockCanvas = createMockCanvas();
    document.body.appendChild(mockCanvas);
  });

  afterEach(() => {
    if (mockCanvas && mockCanvas.parentNode) {
      mockCanvas.parentNode.removeChild(mockCanvas);
    }
  });

  // Helper function to access private method for testing
  const sanitizeEnvelopeRange = (indexStart: number, indexEnd: number): [number, number] => {
    // Access private method through type assertion
    return (annotator as any).sanitizeEnvelopeRange(indexStart, indexEnd);
  };

  describe('Case 1: Selection inside parent tag content', () => {
    test('should keep selection unchanged when selecting middle part of nested content', () => {
      // Text: "<p>This is a <person>John Doe</person> who lives in <location>Paris</location>.</p>"
      // User selects "ohn" from "John" (inside person tag)

      annotator = new Annotator(mockCanvas, '<p>This is a <person>John Doe</person> who lives in <location>Paris</location>.</p>');

      // Find the position of "ohn" in "John" (approximately)
      const result = sanitizeEnvelopeRange(22, 25); // "ohn" selection
      expect(result).toEqual([22, 25]); // Should remain unchanged
    });
  });

  describe('Case 2: Selection equals parent tag', () => {
    test('should keep selection unchanged when selecting entire tag including tags', () => {
      // Text: "<p>test</p>", parsed: "test"
      // User selects entire tag including opening and closing tags (indices 0-11)
      // Expected: "<new><p>test</p></new>"

      annotator = new Annotator(mockCanvas, '<p>test</p>');

      const result = sanitizeEnvelopeRange(0, 11); // Entire tag selection
      expect(result).toEqual([0, 11]); // Should remain unchanged
    });

    test('should keep selection unchanged when selecting entire nested tag', () => {
      // Text: "<p>This is a <person>John Doe</person> who lives in <location>Paris</location>.</p>"
      // User selects entire "<person>John Doe</person>" tag

      annotator = new Annotator(mockCanvas, '<p>This is a <person>John Doe</person> who lives in <location>Paris</location>.</p>');

      const result = sanitizeEnvelopeRange(13, 38); // Entire person tag
      expect(result).toEqual([13, 38]); // Should remain unchanged
    });
  });

  describe('Case 3: Selection overlaps with parent tag boundaries', () => {
    test('should adjust indices when selection includes opening tag', () => {
      // Text: "<p>test</p>"
      // User selects from start of opening tag to middle of content (indices 0-5)
      // Expected: Adjust to be inside parent tag

      annotator = new Annotator(mockCanvas, '<p>test</p>');

      const result = sanitizeEnvelopeRange(0, 5); // Includes opening tag + 'te'
      expect(result).toEqual([3, 5]); // Should adjust to be inside
    });

    test('should prioritize inner tag over outer tag when selection overlaps inner tag', () => {
      // Text: "<p>This is a <person>John Doe</person> who lives in <location>Paris</location>.</p>"
      // User selects from start of <person> tag to middle of "John" (indices 13-25)
      // Expected: Should adjust to be inside <person> tag, not <p> tag

      annotator = new Annotator(mockCanvas, '<p>This is a <person>John Doe</person> who lives in <location>Paris</location>.</p>');

      const result = sanitizeEnvelopeRange(13, 25); // "<person>John"
      expect(result).toEqual([21, 25]); // Should adjust to be inside <person> tag (just "John")
    });

    test('should not adjust when selection spans multiple separate tags', () => {
      // Text: "<p>first here</p> <p>second</p>"
      // User selects "here second" (indices 9-31)
      // Expected: Should not adjust since it spans multiple separate <p> tags

      annotator = new Annotator(mockCanvas, '<p>first here</p> <p>second</p>');

      const result = sanitizeEnvelopeRange(9, 31); // "here</p> <p>second</p>"
      expect(result).toEqual([9, 31]); // Should remain unchanged
    });
  });

  describe('Complex nested structures', () => {
    test('should handle multiple nested tags correctly', () => {
      // Text: "<div>Some <em>emphasized</em> text with <strong>bold</strong> words.</div>"
      // User selects "emphasized" (inside em tag)

      annotator = new Annotator(mockCanvas, '<div>Some <em>emphasized</em> text with <strong>bold</strong> words.</div>');

      // Find position of "emphasized" (inside the em tag)
      const result = sanitizeEnvelopeRange(10, 24); // "<em>emphasized" selection (just the content + opening tag)
      expect(result).toEqual([14, 24]); // Should move to select only content
    });

    test('should handle selection spanning multiple nested tags', () => {
      // Text: "<article>Article content with <quote>quoted text</quote> and <note>additional notes</note>.</article>"
      // User selects from middle of quote to middle of note

      annotator = new Annotator(mockCanvas, '<article>Article content with <quote>quoted text</quote> and <note>additional notes</note>.</article>');

      // This should adjust to be inside the article tag but span across quote and note
      const result = sanitizeEnvelopeRange(25, 83); // Spans multiple nested tags (from 'with' to 'notes' including)
      expect(result[0]).toBe(25); // Should be after opening article tag
      expect(result[1]).toBe(83); // Should be before closing article tag
    });
  });

  describe('Edge cases', () => {
    test('should handle selection with no tags', () => {
      annotator = new Annotator(mockCanvas, 'plain text without tags');

      const result = sanitizeEnvelopeRange(0, 5); // "plain" selection
      expect(result).toEqual([0, 5]); // Should remain unchanged
    });

    test('should handle deeply nested tags', () => {
      annotator = new Annotator(mockCanvas, '<div><p><span><em>deeply nested</em></span></p></div>');

      const result = sanitizeEnvelopeRange(25, 53); // from "nested" until the end
      expect(result).toEqual([25, 31]); // Should use only content
    });

    test('should handle text with < symbols that are not tags', () => {
      // Text contains < symbols in mathematical expressions and comparisons
      annotator = new Annotator(mockCanvas, 'Math: 5 < 10 and <p>real tag</p> with < symbol');

      const result = sanitizeEnvelopeRange(0, 50); // entire text
      expect(result).toEqual([20, 28]); // Should adjust to content of the real tag, ignoring < symbols in math
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle document with multiple paragraphs', () => {
      const text = '<p>First paragraph with <strong>bold text</strong>.</p><p>Second paragraph with <em>italic text</em>.</p>';
      annotator = new Annotator(mockCanvas, text);

      // Select "<strong>bold" from first paragraph 
      const result = sanitizeEnvelopeRange(24, 36);
      expect(result).toEqual([32, 36]);
    });

    test('should handle selection across paragraph boundaries', () => {
      const text = '<p>First paragraph.</p><p>Second paragraph.</p>';
      annotator = new Annotator(mockCanvas, text);

      // This should NOT adjust because it spans first <p> tag completely and ends at content of second <p> tag
      const result = sanitizeEnvelopeRange(0, 40);
      expect(result).toEqual([0, 40]); // Should remain unchanged 
    });

    test('should handle selection across paragraph boundaries with inside tag', () => {
      const text = '<p>First paragraph.</p><add>yes</add><p>Second paragraph.</p>';
      annotator = new Annotator(mockCanvas, text);

      // This should NOT adjust because it spans first <p> tag completely and ends at content of second <p> tag
      const result = sanitizeEnvelopeRange(19, 46);
      expect(result).toEqual([23, 46]); // Should remain unchanged 
    });

    test('should handle selection across additional paragraph boundaries', () => {
      const text = '<p>First paragraph.</p><add>yes</add><p>Second paragraph.</p>';
      annotator = new Annotator(mockCanvas, text);

      const result = sanitizeEnvelopeRange(9, 61);
      expect(result).toEqual([9, 61]); // Should remain unchanged - we only skipped suffixed tags
    });
  });

  describe('Tag positioning requirements', () => {
    test('should position new opening tag after existing closing tag when they would overlap', () => {
      annotator = new Annotator(mockCanvas, '<p>test</p>');

      const result = sanitizeEnvelopeRange(11, 11); 
      expect(result).toEqual([11, 11]);
    });

    test('should position new opening tag after existing closing tag in nested structure', () => {
      annotator = new Annotator(mockCanvas, '<div><p>content</p></div>');

      const result = sanitizeEnvelopeRange(10, 11); // inside content - unchanged
      expect(result).toEqual([10, 11]); 
    });

    test('should handle multiple closing tags at same position', () => {
      // MANUALLY CREATED TEST CASE - DO NOT CHANGE
      // This test represents the exact user scenario where selecting "second" 
      // should place the new opening tag after the closing tag of "first"
      // Text: "<p>first.</p><p>second</p>"
      // User selects "second" - new opening tag would be at same position as closing tag of "first"
      // Expected: New opening tag should be placed after the closing tag of "first"

      annotator = new Annotator(mockCanvas, '<p>first.</p><p>second</p>');

      // selected 'second', new open tag will be at the same position as closing tag of 'first'
      const result = sanitizeEnvelopeRange(9, 26); // </p><p>second</p>
      expect(result).toEqual([13, 26]); // Should adjust to be after the closing tag of 'first'
    });

    test('should handle complex nested structure with div inside p (1)', () => {
      // MANUALLY CREATED TEST CASE - DO NOT CHANGE
      // This test represents the exact user scenario where the new opening tag
      // would be placed at the same position as the old closing tag
      // Text: "<p>This <div>is a</div>.</p><p>He works as </p>"
      // Selected: "</p><p>He works"
      // Expected: "He works"
      // Reason: new selection is smaller than the rightmost <p>...</p> tag

      annotator = new Annotator(mockCanvas, '<p>This <div>is a</div>.</p><p>He works as </p>');

      const result = sanitizeEnvelopeRange(24, 39); // just after dot '.'
      expect(result).toEqual([31, 39]); // Should adjust to be inside the second p tag content
    });


    test('should handle complex nested structure with div inside p (2)', () => {
      // MANUALLY CREATED TEST CASE - DO NOT CHANGE
      // This test represents the exact user scenario where the new opening tag
      // would be placed at the same position as the old closing tag but also at the same position as another old(different) opening tag
      // Text: "<div><p> License.</p><p>Toulouse 1245-46</p></div>"
      // Selected range is </p><p>Toulouse 1245-46</p></div>
      // Expected: indexStart should be moved after the first </p> but before the second <p>, and indexEnd should be moved to just after the last </p>

      annotator = new Annotator(mockCanvas, '<div><p> License.</p><p>Toulouse 1245-46</p></div>');

      const result = sanitizeEnvelopeRange(17, 50); // just after dot '.'
      expect(result).toEqual([21, 44]); // Should adjust to be after the </p> but before the next <p>, and it should end just after the last </p>, since last </div> is bigger 
    });
  });

  describe('Multiline text', () => {
    // MANUALLY CREATED TEST CASE - DO NOT CHANGE
    test('should handle document with multiple paragraphs on multiple lines', () => {
      const text = `<a>
first
</a><b>
second
</b>`;
      annotator = new Annotator(mockCanvas, text);

      // Select "first\nsecond" ( not neighboring tags)
      const result = sanitizeEnvelopeRange(4, 24);
      expect(result).toEqual([4, 24]); // Should not move, since selection is inside the tags and the newlines
    });

    // MANUALLY CREATED TEST CASE - DO NOT CHANGE
    test('should handle document with multiple paragraphs on multiple lines, should not skip content both ways (tested left of selection)', () => {
      const text = `<a>
first ee
</a><b>
second
</b>`;
      annotator = new Annotator(mockCanvas, text);

      // Select "ee\nsecond" ( not neighboring tags)
      const result = sanitizeEnvelopeRange(10, 27);
      expect(result).toEqual([10, 27]); //  Should not move, since selection is inside the tags and the newlines
    });

    test('should handle document with multiple paragraphs on multiple lines, should not skip content or unrelated tags #1', () => {
      const text = `<a>
<b>

first
</b>
<c>

second

</c>
<d>

third
</d>

</a>
`;
      annotator = new Annotator(mockCanvas, text);

      const result = sanitizeEnvelopeRange(9, 31);
      expect(result).toEqual([9, 31]); // Should not change, as both indexes are not conflicting with any tag
    });
    
    test('should handle document with multiple paragraphs on multiple lines, should not skip content or unrelated tags #2', () => {
      const text = `<a>
<b>first
</b>
<c>

second</c>
<d>

third
</d>

</a>
`;
      annotator = new Annotator(mockCanvas, text);
      // selected 'first\n\n\n\nsecond , indexes are adjusted to encompass the opening <b> tag automatically before calling sanitizeEnvelopeRange, endIndex moved to encompass closing </c> tag
      const result = sanitizeEnvelopeRange(4, 33);
      expect(result).toEqual([4, 33]); // Should not change, as both indexes are not conflicting with any tag and indexes are adjusted to encompass the opening <b> tag automatically before calling sanitizeEnvelopeRange, endIndex moved to encompass closing </c> tag
    });
  });
});
