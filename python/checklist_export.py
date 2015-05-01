import sys
import csv
import json
import psycopg2
import pudb
from NameFileInfo import NameFileInfo

column_names = ['SAMPLING_EVENT_ID','LATITUDE', 'LONGITUDE','YEAR',
                'MONTH', 'DAY', 'TIME', 'COUNTRY', 'STATE_PROVINCE',
                'COUNT_TYPE', 'EFFORT_HRS', 'EFFORT_DISTANCE_KM',
                'EFFORT_AREA_HA', 'OBSERVER_ID', 'NUMBER_OBSERVERS', 'GROUP_ID',
                'PRIMARY_CHECKLIST_FLAG']


def get_sql(line,val):
    values = []
    fields = []
    json_dict = {}
    for key in line:
        data = val.get_sql_format(key, line[key])
        if data != None:
            if key in column_names:
                fields.append(key)
                values.append(data)
            elif line[key] != "0":
                json_dict[key] = data

    if values and json_dict:
        insert_fields = ",".join(fields) +",SIGHTINGS"
        json_string = "'{}'".format(json.dumps(json_dict))
        field_value = ",".join(values) + "," + json_string
        insert_string = "INSERT INTO checklists ("+insert_fields+") VALUES ("+field_value+");"
        return insert_string

def get_insert(file_name):
    with open(file_name) as csv_file:
        csv_stream = csv.DictReader(csv_file)
        for row in csv_stream:
            yield row


conn = psycopg2.connect("dbname=birddb user=recursework")
conn.autocommit = True
cursor = conn.cursor()
val = NameFileInfo("data_westhem/doc/checklists.names")
count = 0
for row in get_insert(sys.argv[1]):
    sql = get_sql(row,val)
    try:
        cursor.execute(sql)
    except Exception,e:
        print sql,e

conn.close()
