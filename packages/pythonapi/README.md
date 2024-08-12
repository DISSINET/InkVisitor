# Python API

This package contains a Python API which provides additional resources for nodejs api.

## Python API

The Python API is implemented using Flask. It provides a simple `/test` endpoint that returns a JSON response so the nodejs api can demonstratively use it.

### Usage

1. Set up and load environment variables

- create `env/.env` file as a copy of the `env/example.env` and edit all variables that are needed
- run `export $(cat env/.env | xargs)` to load the variables

2. Install dependencies:

```bash
pip install -r requirements.txt
pip install git+https://$GITHUB_PAT@github.com/DISSINET/corpus-nlp.git
pip install https://huggingface.co/latincy/la_core_web_lg/resolve/main/la_core_web_lg-any-py3-none-any.whl
```

3. Run the api:

```bash
python api.py
```

4. You can now make GET requests to the /test endpoint:

```bash
curl http://localhost:5000/test
```

5. Using the nodejs server, which works like proxy, you can also do request do `pythonapi` [router](../server/src/modules/pythondata/index.ts)

```bash
curl http://localhost:3000/:path
```

Replace `:path` with any route that is registered in python app - ie. `test`, so `http://localhost:3000/test` will be routed to the python handler with the same path.

6. Update ACL permissions, if creating path `/newpath` in pythonapi router, add additional route

```json
{
  "controller": "pythondata",
  "route": "/newpath",
  "method": "GET",
  "roles": ["*"]
}
```
