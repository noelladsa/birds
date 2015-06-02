import sys
import csv
import json
import psycopg2
import psycopg2.errorcodes as errorcodes
from datetime import datetime

from NameFileInfo import NameFileInfo

checklist_colnames = ['SAMPLING_EVENT_ID','LATITUDE', 'LONGITUDE','YEAR',
                'MONTH', 'DAY', 'TIME', 'COUNTRY', 'STATE_PROVINCE',
                'COUNT_TYPE', 'EFFORT_HRS', 'EFFORT_DISTANCE_KM',
                'EFFORT_AREA_HA', 'OBSERVER_ID', 'NUMBER_OBSERVERS', 'GROUP_ID',
                'PRIMARY_CHECKLIST_FLAG']


def get_line(file_name):
    with open(file_name) as csv_file:
        csv_stream = csv.DictReader(csv_file)
        for row in csv_stream:
            yield row


def save_to_db(conn_string, name_file, db_file, insert_func):
    count = 0
    start_time = datetime.now()
    with psycopg2.connect(conn_string) as conn:
        with conn.cursor() as cur:
            for row in get_line(db_file):
                sql = insert_func(row,name_file)
                try:
                    cur.execute(sql)
                    count = count + 1
                    if count % 1000 == 0:
                        conn.commit()
                        print count," done"
                except Exception,e:
                    print errorcodes.lookup(e.pgcode)
                    print sql,e
                    break
    print datetime.now() - start_time


def get_checklist_sql(line, name_file):
    val = NameFileInfo(name_file)
    values = []
    fields = []
    json_arr = []
    for key in line:
        json_dict = {}
        data = val.get_sql_format(key, line[key])
        if data:
            if key in checklist_colnames:
                fields.append(key)
                values.append(data)
            elif line[key] != "0":          # Birds not sighted = 0
                json_dict["name"] = key
                json_dict["value"] = data
                json_arr.append(json_dict)

    if values and json_arr:
        json_string = "'{}'".format(json.dumps(json_arr))
        insert_sql = "INSERT INTO checklists ({}) VALUES ({});".format(
                     ",".join(fields) + ",SIGHTINGS",
                     ",".join(values) + "," + json_string)
        return insert_sql


def get_covariate_sql(row, name_file):
    val = NameFileInfo(name_file)
    insert_dict = {}
    for key, value in row.items():
        data = val.get_sql_format(key, value)
        if data:
            insert_dict[key] = data
    if insert_dict:
        insert_sql = "INSERT INTO core_covariates ({}) VALUES ({});".format(
                     ",".join(insert_dict.keys()),",".join(insert_dict.values()))
        return insert_sql



if __name__ == "__main__":
    conn = "dbname=birddb user=recursework"
    name_file_covar = "core-covariates.name"
    name_file_checklist = "data_westhem/doc/checklists.names"

    args = sys.argv
    if len(args) == 3:
        if args[1] == "checklist":
            save_to_db(conn, name_file_checklist,args[2],get_checklist_sql)
        elif args[1] == "covar":
            save_to_db(conn, name_file_covar,args[2],get_covariate_sql)
    else:
        print """Run bird_import.py with <command> <db_file> where <command>
        is 'checklist' or 'covar'"""

