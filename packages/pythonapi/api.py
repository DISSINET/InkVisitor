from flask import Flask, request, jsonify

import re
from corpus_nlp import parse, spcy

ps = parse.Parse()
sp = spcy.Spacy()

app = Flask(__name__)

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Hello from Python API!'})


# Flask route to process the text
@app.route('/segment', methods=['POST'])
def segment():
    """
    Extracting text_in from the request.

    Args:
        text (text): the text to be segmented
 
    Returns:
        dict: JSON response with the segmented text and segments
    """

    data = request.json
    print('Request received!', data)
    text_in = data.get('text', '')

    newline_positions = [m.start() for m in re.finditer('\n', text_in)]
    text_in = re.sub(r'\s+', ' ', text_in)
    text_in = re.sub(r'\n+', '\n', text_in)
    text_in = text_in.strip()

    # Call the segment_text function
    segmented_text = ps.parse_text(text_in, newline_positions)
    print('Segmented', segmented_text)

    # Return the JSON response
    return jsonify(segmented_text)


if __name__ == '__main__':
    app.run(debug=True)
    