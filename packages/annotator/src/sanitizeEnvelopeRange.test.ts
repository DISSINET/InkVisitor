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
    test('should keep selection unchanged when selecting text inside parent tag', () => {
      // Text: "<p>test</p>", parsed: "test"
      // User selects "te" (indices 3-5 in raw text)
      // Expected: "<p><new>te</new>st</p>"
      
      annotator = new Annotator(mockCanvas, '<p>test</p>');
      
      const result = sanitizeEnvelopeRange(3, 5); // "te" selection
      expect(result).toEqual([3, 5]); // Should remain unchanged
    });

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
      const result = sanitizeEnvelopeRange(14, 24); // "emphasized" selection (just the content)
      expect(result).toEqual([14, 24]); // Should remain unchanged
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
    test('should handle empty selection', () => {
      annotator = new Annotator(mockCanvas, '<p>test</p>');
      
      const result = sanitizeEnvelopeRange(3, 3); // Empty selection
      expect(result).toEqual([3, 3]); // Should remain unchanged
    });

    test('should handle selection with no tags', () => {
      annotator = new Annotator(mockCanvas, 'plain text without tags');
      
      const result = sanitizeEnvelopeRange(0, 5); // "plain" selection
      expect(result).toEqual([0, 5]); // Should remain unchanged
    });

    test('should handle malformed tags gracefully', () => {
      annotator = new Annotator(mockCanvas, '<p>test</div>'); // Mismatched tags
      
      const result = sanitizeEnvelopeRange(0, 7); // "test" selection
      expect(result).toEqual([0, 7]); // Should handle gracefully
    });

    test('should handle deeply nested tags', () => {
      annotator = new Annotator(mockCanvas, '<div><p><span><em>deeply nested</em></span></p></div>');
      
      const result = sanitizeEnvelopeRange(25, 31); // "nested" selection
      expect(result).toEqual([25, 31]); // Should remain unchanged
    });
  });

  describe('Real-world scenarios', () => {
    test('should handle document with multiple paragraphs', () => {
      const text = '<p>First paragraph with <strong>bold text</strong>.</p><p>Second paragraph with <em>italic text</em>.</p>';
      annotator = new Annotator(mockCanvas, text);
      
      // Select "bold" from first paragraph
      const result = sanitizeEnvelopeRange(32, 36);
      expect(result).toEqual([32, 36]); // Should remain unchanged
    });

    test('should handle selection across paragraph boundaries', () => {
      const text = '<p>First paragraph.</p><p>Second paragraph.</p>';
      annotator = new Annotator(mockCanvas, text);
      
      // This should NOT adjust because it spans multiple separate tags
      // Adjusting would break the XML structure
      const result = sanitizeEnvelopeRange(0, 40);
      expect(result).toEqual([0, 40]); // Should remain unchanged to avoid breaking XML
    });
  });

  describe('Tag positioning requirements', () => {
    test('should position new opening tag after existing closing tag when they would overlap', () => {
      // Text: "<p>test</p>"
      // User selects from end of content to start of closing tag (indices 7-7)
      // Expected: New opening tag should be placed after the closing tag
      // Result should be: "<p>test</p><new>...</new>" not "<p>test</new>..."
      
      annotator = new Annotator(mockCanvas, '<p>test</p>');
      
      // Selection that ends exactly at the start of the closing tag
      const result = sanitizeEnvelopeRange(7, 7); // Selection ends at start of closing tag
      expect(result).toEqual([11, 11]); // Should adjust to be after the closing tag
    });

    test('should position new opening tag after existing closing tag in nested structure', () => {
      // Text: "<div><p>content</p></div>"
      // User selects from end of p content to end of p closing tag
      // Expected: New opening tag should be placed after the p closing tag
      
      annotator = new Annotator(mockCanvas, '<div><p>content</p></div>');
      
      // Selection that ends at the p closing tag
      const result = sanitizeEnvelopeRange(10, 11); // Ends at </p>
      expect(result).toEqual([10, 11]); // Should remain unchanged since it doesn't overlap with closing tag
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
      const result = sanitizeEnvelopeRange(9, 26); 
      expect(result).toEqual([13, 26]); // Should adjust to be after the closing tag of 'first'
    });

    test('should handle complex nested structure with div inside p', () => {
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

    
    test('should handle complex nested structure with div inside p', () => {
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
});
