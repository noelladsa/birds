import json
import decimal

import db_interactions as q
from db_interactions import Options
from . import app


def get_birdlist():
    q.CONN_STRING = app.config['DB_CONF']
    results = q.get_birdlist(Options.JSON)
    jsonarr = [item[0] for item in results]
    jsonarr.sort()
    return json.dumps(jsonarr)


def get_freq_birds(sci_name, state):
    q.CONN_STRING = app.config['DB_CONF']
    birds = q.get_other_birds(sci_name, state, None, options=Options.PANDAS)
    if birds.empty:
        return
    freq_table = birds["name"].value_counts()
    results = freq_table/freq_table[sci_name]
    return results[0:20].to_json() if len(results) > 20 else results.to_json()


def get_bird_info(sci_name):
    predictions = get_freq_birds(sci_name, None)
    states = get_locations_seen(sci_name)
    aggreg = {'states': json.loads(states) if states else "",
              'birds': json.loads(predictions) if predictions else ""}
    return json.dumps(aggreg)


def get_locations_seen(sci_name):
    q.CONN_STRING = app.config['DB_CONF']
    states = q.get_locations_seen(sci_name, None, options=Options.PANDAS)
    if states.empty:
        return
    freq_table = states["state_province"].value_counts()
    cleaned_states = dict([(state.replace('_', " "), count)
                          for state, count in freq_table.iteritems()])
    return json.dumps(cleaned_states)


def decimal_default(obj):
    if isinstance(obj, decimal.Decimal):
        return float(obj)
    raise TypeError

if __name__ == "__main__":
    print get_bird_info("Turdus_migratorius")
