# rough immitation of import.ts
# purpose: to test import to rethinkDB because of import.ts problems on windows platforms
##########################################################################################

# this script is obsolete, it does not correspond to latest db development, use import.ts
print("This script is obsolete, it does not correspond to latest db development, use import.ts")
exit(-1)


import sys, bcrypt, json
from rethinkdb import RethinkDB
from dotenv import dotenv_values

# import twisted / tornado [possible to immitate await syntax]

r = RethinkDB()

datasets = {
  "all": [
  {
    "name": "acl_permissions",
    "datafile": "datasets/default/acl_permissions.json",
  },
  {
    "name": "entities",
    "datafile": "datasets/all/entities.json",
    "indexes": [
      r.table("entities").index_create("class"),
      r.table("entities").index_create("label"),
      r
        .table("entities")
        .index_create(
        "data.actants.entityId",
        r.row["data"]["actants"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.actions.actionId",
        r.row["data"]["actions"]["actionId"]
      ),
      r.table("entities").index_create("data.tags", r.row["data"]["tags"]),
      r
        .table("entities")
        .index_create(
        "data.props.type.entityId",
        r.row["data"]["props"]["type"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.props.value.entityId",
        r.row["data"]["props"]["value"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.references.resource",
        r.row["data"]["references"]["resource"]
      ),
      r
        .table("entities")
        .index_create("data.props.origin", r.row["data"]["props"]["origin"]),
      r
        .table("entities")
        .index_create("data.territory.territoryId", r.row["data"]["territory"]["territoryId"]),
      r
        .table("entities")
        .index_create("data.parent.territoryId", r.row["data"]["parent"]["territoryId"]),
    ],
  },
  {
    "name": "users",
    "datafile": "datasets/default/users.json",
  },
  {
    "name": "audits",
    "datafile": "datasets/all/audits.json",
  },
],"all-test":[
  {
    "name": "acl_permissions",
    "datafile": "datasets/default/acl_permissions.json",
  },
  {
    "name": "entities",
    "datafile": "datasets/all-test/entities.json",
    "indexes": [
      r.table("entities").index_create("class"),
      r.table("entities").index_create("label"),
      r
        .table("entities")
        .index_create(
        "data.actants.entityId",
        r.row["data"]["actants"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.actions.actionId",
        r.row["data"]["actions"]["actionId"]
      ),
      r.table("actants").index_create("data.tags", r.row["data"]["tags"]),
      r
        .table("entities")
        .index_create(
        "data.props.type.entityId",
        r.row["data"]["props"]["type"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.props.value.entityId",
        r.row["data"]["props"]["value"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.references.resource",
        r.row["data"]["references"]["resource"]
      ),
      r
        .table("entities")
        .index_create("data.props.origin", r.row["data"]["props"]["origin"]),
      r
        .table("entities")
        .index_create("data.territory.territoryId", r.row["data"]["territory"]["territoryId"]),
      r
        .table("entities")
        .index_create("data.parent.territoryId", r.row["data"]["parent"]["territoryId"]),
    ],
  },
  {
    "name": "users",
    "datafile": "datasets/default/users.json",
  },
  {
    "name": "audits",
    "datafile": "datasets/all-test/audits.json",
  },
],"all-parsed":[
  {
    "name": "acl_permissions",
    "datafile": "datasets/default/acl_permissions.json",
  },
  {
    "name": "entities",
    "datafile": "datasets/all-parsed/entities.json",
    "indexes": [
      r.table("entities").index_create("class"),
      r.table("entities").index_create("label"),
      r
        .table("entities")
        .index_create(
        "data.actants.entityId",
        r.row["data"]["actants"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.actions.actionId",
        r.row["data"]["actions"]["actionId"]
      ),
      r.table("actants").index_create("data.tags", r.row["data"]["tags"]),
      r
        .table("entities")
        .index_create(
        "data.props.type.entityId",
        r.row["data"]["props"]["type"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.props.value.entityId",
        r.row["data"]["props"]["value"]["entityId"]
      ),
      r
        .table("entities")
        .index_create(
        "data.references.resource",
        r.row["data"]["references"]["resource"]
      ),
      r
        .table("entities")
        .index_create("data.props.origin", r.row["data"]["props"]["origin"]),
      r
        .table("entities")
        .index_create("data.territory.territoryId", r.row["data"]["territory"]["territoryId"]),
      r
        .table("entities")
        .index_create("data.parent.territoryId", r.row["data"]["parent"]["territoryId"]),
    ],
  },
  {
    "name": "users",
    "datafile": "datasets/all-parsed/users.json",
  },
  {
    "name": "audits",
    "datafile": "datasets/all-parsed/audits.json",
  },
]
}


def hash_password(raw_password: str) -> str:
  return bcrypt.hashpw(str.encode(raw_password), bcrypt.gensalt(10)).decode()


datasetId: str = sys.argv[1]
dbMode: str = sys.argv[2]
envData = dotenv_values(f"../env/.env.{dbMode}")
tablesToImport = datasets[datasetId]

print(f"***importing dataset {datasetId}***")
print("")

config = {
  "db": envData['DB_NAME'],
  "host": envData['DB_HOST'],
  "port": envData['DB_PORT'],
  "password": envData['DB_PASS'] or ""
}

conn = None

try:

  conn = r.connect(config["host"], config["port"], config["db"], config["password"])
  # set default database
  conn.use(config["db"])

  # Drop the database.
  try:
    r.db_drop(config["db"]).run(conn)
    print("database dropped")
  except Exception as e:
    print("database not dropped", e)

  # Recreate the database
  try:
    r.db_create(config["db"]).run(conn)
    print("database created")
  except Exception as e:
    print("database not created, reason:", e)

  for table in tablesToImport:
    # recreate the table
    try:
      print(f"table {table['name']} will be created")
      r.table_create(table["name"]).run(conn)
      print(f"table {table['name']} created")
    except Exception as e:
      print(f"table {table['name']} was not created, reason: {e}")

    try:
      fpath = "../" + table["datafile"]
      print("reading ", fpath)
      data = json.load(open(fpath, ))

      if table["name"] == "users":
        for user in data:
          user["password"] = hash_password(user["password"]) if user["password"] else hash_password("")

      if table["name"] == "audits":
        pass

      r.table(table["name"]).insert(data).run(conn)
      print(f"data into the table {table['name']} inserted")

    except Exception as e:
      print(f"Inserting unsuccesfull, reason:{repr(e)}, type:{type(e)}")


except Exception as e:
  print(e)
finally:
  print("closing connection")
  if conn:
    conn.close()
