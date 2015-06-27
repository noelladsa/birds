import psycopg2
import pandas.io.sql as pandsql
import json

CONN_STRING = None


class Options(object):
    PANDAS = 0
    JSON = 1
    NORMAL = 2


def get_sql_results(query, options, param_dict):
    with psycopg2.connect(CONN_STRING) as conn:
        if options == Options.PANDAS:
            return pandsql.read_sql(query, conn, params=param_dict)
        if options == Options.JSON:
            query = "select row_to_json(res) from (" + query + ") res;"
        with conn.cursor() as cur:
            cur.execute(query, param_dict)
            return cur.fetchall()


def _add_checklist_filter(query, sci_name, state, year):
    param_dict = {}
    filters = ""
    if sci_name:
        print filters
        filters += _add_cond_prefix(filters) + """sightings @> %(json)s"""
        param_dict["json"] = json.dumps([{"name": sci_name}])
    if year:
        print filters
        filters += _add_cond_prefix(filters) + """year = %(year)s"""
        param_dict["year"] = year
    if state:
        print filters
        filters += _add_cond_prefix(filters) + """state_province = %(state)s"""
        param_dict["state"] = state
    return query + filters, param_dict


def _add_cond_prefix(filters):
    return "where " if not filters else "and "


def get_sightings(sci_name, loc=None, year=None, options=Options.NORMAL):
    query = """select latitude,longitude,year,month,day from checklists """
    query, param_dict = _add_checklist_filter(query, sci_name, loc, year)
    return get_sql_results(query, options, param_dict)


def get_locations_seen(sci_name, year=None, options=Options.NORMAL):
    query = """select state_province from checklists """
    query, param_dict = _add_checklist_filter(query, sci_name, None, year)
    return get_sql_results(query, options, param_dict)


def get_other_birds(sci_name, state=None, year=None, options=Options.NORMAL):
    query = """select sampling_event_id,jsonb_array_elements(sightings)->'name'
    as name,jsonb_array_elements(sightings)->'value'
    as value from checklists """
    query, param_dict = _add_checklist_filter(query, sci_name, state, year)
    return get_sql_results(query, options, param_dict)


def get_birdlist(options=Options.NORMAL):
    query = """select sci_name,replace(primary_com_name,'_',' ') as
    primary_com_name from taxonomy"""
    return get_sql_results(query, options, param_dict=None)

if __name__ == "__main__":
    print get_other_birds("Turdus_migratorius")
