# Python API 
This package contains a Python API which provides additional resources for nodejs api.

## Python API

The Python API is implemented using Flask. It provides a simple `/test` endpoint that returns a JSON response so the nodejs api can demonstratively use it.

### Usage

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the api:

```bash
python api.py
```

3. You can now make GET requests to the /test endpoint:

```bash
curl http://localhost:5000/test
```