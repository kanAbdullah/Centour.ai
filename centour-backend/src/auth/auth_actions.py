from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity
)
from argon2 import PasswordHasher
from sqlalchemy import text, select
from datetime import timedelta

from src.db_interaction.db_service import db_service
from src.core_mechanism.extensions import db

auth = Blueprint("auth", __name__)
ph = PasswordHasher()

class auth_actions:
    def register():
        data = request.json

        existing_user = db.session.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": data["email"]}
        ).fetchone()

        if existing_user:
            return {"error": "User already exists"}, 409
        
        password_hash = ph.hash(data["password"])
        user_login_credentials = {
            "email": data["email"],
            "password_hash": password_hash
        }
        result = db.session.execute(
            text("INSERT INTO users (email, username, password_hash) VALUES (:email, :username, :password_hash) RETURNING id"),
            {"email": data["email"], 
             "username": data["username"],
             "password_hash": password_hash})
        
        db.session.commit()
        return jsonify({"user_id": str(result.fetchone()[0])})

    def login():
        data = request.json
        user = db.session.execute(
            text("SELECT * FROM users WHERE email = :email"),
            {"email": data["email"]}
        ).fetchone()
        
        if not user:
            return {"error": "User not found"}, 404
        try:
            ph.verify(user.password_hash, data["password"])
        except:
            return {"error": "Wrong password"}, 401

        #access = create_access_token(identity=str(user["_id"]), expires_delta=timedelta(minutes=20))
        #refresh = create_refresh_token(identity=str(user["_id"]))

        access = create_access_token(identity=str(user.id), expires_delta=timedelta(minutes=20))
        refresh = create_refresh_token(identity=str(user.id))

        response = jsonify({"access_token": access})
        response.set_cookie(
            "refresh_token", refresh,
            httponly=True, samesite="Strict", secure=True, path="/auth/refresh"
        )
        return response

