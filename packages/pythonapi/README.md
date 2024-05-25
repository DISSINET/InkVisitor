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

4. Using the nodejs server, which works like proxy, you can also do request do `pythonapi` [router](../server/src/modules/pythondata/index.ts)

```bash
curl http://localhost:3000/:path
```

Replace `:path` with any route that is registered in python app - ie. `test`, so `http://localhost:3000/test` will be routed to the python handler with the same path.