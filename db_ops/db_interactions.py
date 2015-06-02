import psycopg2
import pandas.io.sql as pandsql
import json
import sys

CONN_STRING = "dbname=birddb user=recursework"


def get_sightings(bird_name,year):
    string = """select latitude,longitude,year,month,day from checklists
    where sightings @> %(json)s and year = %(year)s;"""

    param_dict = {"json": json.dumps([{"name": bird_name}]),"year": year}
    with psycopg2.connect(CONN_STRING) as conn:
        with conn.cursor() as cur:
            return pandsql.read_sql(string,conn,params=param_dict)


def get_checklists(bird_name,year):
    string = """select sampling_event_id,jsonb_array_elements(sightings)->'name' as name,
    jsonb_array_elements(sightings)->'value' as value from checklists
    where sightings @> %(json)s and year = %(year)s;"""
    param_dict = {"json": json.dumps([{"name": bird_name}]),"year": year}
    with psycopg2.connect(CONN_STRING) as conn:
        with conn.cursor() as cur:
            return pandsql.read_sql(string,conn,params=param_dict)


def  get_otherbirds_americanrobin():
    return get_checklists("Turdus_migratorius",2003)

def get_americanrobin():
    return get_sightings("Turdus_migratorius",2003)


if __name__ == "__main__":
    print get_otherbirds_americanrobin()
