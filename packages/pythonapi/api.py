from flask import Flask, request, jsonify
from segment import segment_text

app = Flask(__name__)

@app.route('/test', methods=['GET'])
def test():
    return jsonify({'message': 'Hello from Python API!'})


# Flask route to process the text
@app.route('/segment', methods=['POST'])
def segment():
    # Extracting text_in from the request
    data = request.json
    text_in = data.get('text_in', '')
    return jsonify(segment_text(text_in))


if __name__ == '__main__':
    app.run(debug=True)
    