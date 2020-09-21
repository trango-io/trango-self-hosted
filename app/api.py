from flask_restful import Resource, Api
from flask import jsonify, Flask, request
from flask_cors import CORS, cross_origin

SECERT_KEY1 = "z/EahGU31q1G5L14763UItXD6dI2X57RlUS7CI2n43g="
SECERT_KEY2 = "zEahGU31q1G5L14763UItXD6dI2X57RlUS7CI2n43g"


class checkurl(Resource):
    def post(self):
        data = request.form
        print(data)
        secertkey = data['secretkey']
        if secertkey:
            if secertkey == SECERT_KEY1 or secertkey == SECERT_KEY2:
                return { "valid": True, "msg": "Welcome to trango"}
            else:
                return { "valid": False, "msg": "Secert key not found"}
        else:
            return { "valid": False, "msg": "Empty parameter"}

app = Flask(__name__)
CORS(app)
api = Api(app)
api.add_resource(checkurl, '/checkurl')

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8081)