import "ts-jest";
import Document from "./document";

const removeAnchor = (content: string, entityId: string, index: number) => {
  const document = new Document({ content });
  document.removeAnchor(entityId, index);
  return document.content;
};

describe("Document.removeAnchor", () => {
  // one statement anchored in three places, one after another
  const content =
    'a <s1 elvl="1">one</s1> b <s1 elvl="1">two</s1> c <s1 elvl="1">three <p1>Petrus</p1></s1> d';

  test("removes the first anchor together with its own closing tag", () => {
    expect(removeAnchor(content, "s1", 0)).toEqual(
      'a one b <s1 elvl="1">two</s1> c <s1 elvl="1">three <p1>Petrus</p1></s1> d'
    );
  });

  test("removes the last anchor without repeating the text before it", () => {
    expect(removeAnchor(content, "s1", 2)).toEqual(
      'a <s1 elvl="1">one</s1> b <s1 elvl="1">two</s1> c three <p1>Petrus</p1> d'
    );
  });

  test("keeps the text intact whichever anchor is removed", () => {
    const text = content.replace(/<[^>]+>/g, "");
    for (const index of [0, 1, 2]) {
      const result = removeAnchor(content, "s1", index);
      expect(result.replace(/<[^>]+>/g, "")).toEqual(text);
      expect(result.match(/<s1[^>]*>/g)).toHaveLength(2);
      expect(result.match(/<\/s1>/g)).toHaveLength(2);
    }
  });

  test("does not count a self-closing tag as an anchor", () => {
    expect(removeAnchor('<s1 n="2"/> a <s1>one</s1> b', "s1", 0)).toEqual(
      '<s1 n="2"/> a one b'
    );
  });

  // the index counts opening tags in document order, so 0 is the outer anchor
  test("removes an anchor nested in another anchor of the same entity", () => {
    const nested = "<s1>outer <s1>inner</s1> tail</s1>";
    expect(removeAnchor(nested, "s1", 0)).toEqual("outer <s1>inner</s1> tail");
    expect(removeAnchor(nested, "s1", 1)).toEqual("<s1>outer inner tail</s1>");
  });
});
