# rough immitaion of import.ts
# purpose: to test import to rethinkDB because of import.ts problems on windows platforms


# OBSERVATIONS
# 1) connection to db needs to be probably per request, it is closes automatically after each request
# 2) no... fully true,  dropping and creating db was done ...
#
#
#
##########################################################################################

from typing import List, Tuple, Dict

import sys
from rethinkdb import RethinkDB
from dotenv import dotenv_values
#import twisted / tornado [possible to immitate await syntax]

r = RethinkDB()

datasets = { "all" : [
    {
      "name": "acl_permissions",
      "data": "datasets/all/acl_permissions.json",
    },
    {
      "name": "actants",
      "data": "datasets/all/actants.json",
      "indexes": [
        r.table("actants").index_create("class"),
        r.table("actants").index_create("label"),
        r
          .table("actants")
          .index_create(
            "data.actants.actant",
            r.row["data"]["actants"]["actant"]
          ),
        r
          .table("actants")
          .index_create(
            "data.actions.action",
            r.row["data"]["actions"]["action"]
          ),
        r.table("actants").index_create("data.tags", r.row["data"]["tags"]),
        r
          .table("actants")
          .index_create(
            "data.props.type.id",
            r.row["data"]["props"]["type"]["id"]
          ),
        r
          .table("actants")
          .index_create(
            "data.props.value.id",
            r.row["data"]["props"]["value"]["id"]
          ),
        r
          .table("actants")
          .index_create(
            "data.references.resource",
            r.row["data"]["references"]["resource"]
          ),
        r
          .table("actants")
          .index_create("data.props.origin", r.row["data"]["props"]["origin"]),
        r
          .table("actants")
          .index_create("data.territory.id", r.row["data"]["territory"]["id"]),
        r
          .table("actants")
          .index_create("data.parent.id", r.row["data"]["parent"]["id"]),
      ],
    },
    {
      "name": "users",
      "data": "datasets/all/users.json",
    },
    {
      "name": "audits",
      "data": "datasets/all/audits.json",
    },
  ]
}

datasetId:str = sys.argv[1]
dbMode:str = sys.argv[2]
envData = dotenv_values(f"../env/.env.{dbMode}")
tablesToImport = datasets[datasetId]

print(f"***importing dataset {datasetId}***")
print("")

config = {
    "db": envData['DB_NAME'],
    "host": envData['DB_HOST'],
    "port": envData['DB_PORT'],
    "password": envData['DB_AUTH']
  }


def conn():
    conn = r.connect(config["host"], config["port"])
    # set default database
    conn.use(config["db"])
    return conn

try:
    # Drop the database.
    try:
        r.db_drop(config["db"]).run(conn())
        print("database dropped")
    except Exception as e:
        print("database not dropped", e)

    # Recreate the database
    try:
        r.db_create(config["db"]).run(conn())
        print("database created")
    except Exception as e:
        print("database not created, reason:", e)

    for table in tablesToImport:
      # recreate the table
      try:
        print(f"table {table['name']} will be created")
        r.table_create(table["name"]).run(conn())
        print(f"table{table['name']} created")
      except Exception as e:
        print(f"table {table['name']} was not created, reason: {e}")


except Exception as e:
    print(e)
finally:
    pass
    # print("closing connection")
    # if (conn):
    #   conn.close()
