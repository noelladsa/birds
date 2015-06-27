from flask import render_template
from . import app
import bird_api

ROUTE_STRING = "/birds"


@app.route('/')
def index():
    return render_template("index.html")


@app.route(ROUTE_STRING + "/list", methods=['GET'])
def get_birdlist():
    return bird_api.get_birdlist()


@app.route(ROUTE_STRING + "/<string:sci_name>", methods=['GET'])
def get_bird_info(sci_name):
    bird_info = bird_api.get_bird_info(sci_name)
    return bird_info if bird_info else ""


@app.route(ROUTE_STRING + "/<string:sci_name>/state/<string:state>",
           methods=['GET'])
def get_nearbybirds(sci_name, state):
    results = bird_api.get_freq_birds(sci_name, state)
    return results if results else ""
