from crypt import methods
import json
from flask import Flask, jsonify, request
from flask_restful import Api
from the_artisans_shared.middleware import validate_request, current_user, NodeCookieSessionDecode, exception_handler, require_auth
from the_artisans_shared.errors import NotFoundError 

from marshmallow import Schema, fields

app = Flask(__name__)
api = Api(app)

app.wsgi_app = NodeCookieSessionDecode(app.wsgi_app)

@app.before_request
def attach_current_user():
    current_user()

handle_exception  = app.errorhandler(Exception)
handle_exception(exception_handler)

class RequestBody(Schema):
    email = fields.Email(required=True)
    value = fields.Int(required=True)
class RequestQuery(Schema):
    lat = fields.Str(required=True)
    lng = fields.Str(required=True)
class RequestParams(Schema):
    id = fields.Str(required=True)

@app.route('/api/geolocation/<id>', methods = ["POST"])
@validate_request(
    body_schema_class=RequestBody,
    query_schema_class=RequestQuery,
    param_schema_class=RequestParams
)
def get_geo(id):
    # print('user', request.current_user.get('email'))
    return jsonify({"Hello": "Hello"})
    # pass


@app.route('/', defaults={"path": ''})
@app.route('/<path:path>')
def not_found_route(path):
    raise NotFoundError()