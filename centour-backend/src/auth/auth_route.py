from flask import Blueprint, jsonify
from src.auth.auth_actions import auth_actions
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
auth_bp = Blueprint("auth",__name__)

@auth_bp.route("/register", methods=["POST"])
def register():
    return auth_actions.register()

@auth_bp.route("/login", methods=["POST"])
def login():
    print("authorization debug")
    return auth_actions.login()

@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    user_id = get_jwt_identity()
    access = create_access_token(identity=user_id)
    return {"access_token": access}, 200

@auth_bp.route("/verify", methods=["GET"])
@jwt_required(optional=True)
def verify_token():
    identity = get_jwt_identity()
    if identity is None:
        return {"msg": "invalid"}, 401

    return {"msg": "ok"}, 200

@auth_bp.route("/verify", methods=["OPTIONS"])
def verify_options():
    return "", 200