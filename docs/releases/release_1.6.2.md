# What's changed [Oct 13, 2026]

## Annotator

- The gutter numbers paragraphs instead of lines; empty, tag-only and whitespace-only lines take no number, and soft-wrapped lines stay blank, so numbers do not change on resize (#3305)
- Go to a paragraph from the toolbar or with Ctrl/Cmd+G (#3305)
- The first paragraph gets the same first-line indent as the rest (#3305)
- The paragraph number gutter fits the highest number and the current font size
- Asymmetrical anchor check skips self-closing tags such as `<e1 />` and pairs tags in document order, so `</x>...<x>` is reported instead of passing (#3306)
- Anchor warnings show the paragraph number of each issue, with locate and remove actions beside it (#3306)
- Saving a large document no longer fails with a request-too-large error, as only the text content is sent
- The active Territory wash is drawn only when the Territory has a single anchor
- No blue browser selection tint over the text canvas

## Other improvements and fixes

- Suggester suggestions are at least 32rem wide, so narrow suggesters (Statement actants, props) no longer cut Entity labels short (#3301)
- A URL that names an Entity detail opens the detail panel even if it was collapsed or minimized (#3314)
- Statement templates open in the Editor from the EntityTag context menu
- Scrolling modal bodies blur at the top and bottom edges
- Documents page: the modal opens a read-only document view, and the row action icons are resized and recoloured (#3305)
- A request-too-large (413) server response shows its own error instead of "Connection to server lost"
