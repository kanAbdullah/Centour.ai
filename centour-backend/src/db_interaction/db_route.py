# routes/study_routes.py
from flask import Blueprint, jsonify
from src.db_interaction.db_service import db_service
from flask_jwt_extended import jwt_required
study_bp = Blueprint("study", __name__)

@study_bp.route("/studies", methods=["GET"])
@jwt_required()
def get_studies():
    studies = db_service.list_studies()
    return jsonify(studies)

@study_bp.route("/studies", methods=["POST"])
@jwt_required()
def create_study():
    return db_service.create_study()

@study_bp.route("/topics/<study_id>", methods=["GET"])
@jwt_required()
def get_topics(study_id):
    topics = db_service.list_topics(study_id)
    return jsonify(topics)

@study_bp.route("/topics", methods=["POST"])
@jwt_required()
def create_topic():
    return db_service.create_topic()

@study_bp.route("/chats/<topic_id>", methods=["GET"])
@jwt_required()
def get_chats(topic_id):
    chats = db_service.list_chats(topic_id)
    return jsonify(chats)

@study_bp.route("/chats", methods=["POST"])
@jwt_required()
def create_chat():
    return db_service.create_chat()

@study_bp.route("/messages/<chat_id>", methods=["GET"])
@jwt_required()
def get_messages(chat_id):
    messages = db_service.get_messages(chat_id)
    return messages
