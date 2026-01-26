from flask import Flask, request, jsonify
from src.core_mechanism.extensions import db
from sqlalchemy import text

from flask_jwt_extended import get_jwt_identity

from dotenv import load_dotenv
from flask_cors import CORS
import os,sys

load_dotenv()

class db_service:
                
    def to_json(self,data):
        result = []
        for item in data:
            d = dict(item)
            for k, v in d.items():
                if isinstance(v, ObjectId):
                    d[k] = str(v)
            result.append(d)
        return result
    #
    #  CRUD STUDY
    #  
    def create_study(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        sql_result = db.session.execute(text(
            "INSERT INTO studies (title, owner_user_id) VALUES (:title, :owner_user_id) RETURNING id"),
            {"title": data.get("title"), "owner_user_id": user_id}
        )
        db.session.commit()
        return jsonify({"study_id": str(sql_result.fetchone()[0])})
    
    def list_studies(self):
        user_id = get_jwt_identity()
        obj = db.session.execute(text(
            "SELECT id, title, owner_user_id FROM studies WHERE owner_user_id = :owner_user_id"),
            {"owner_user_id": user_id}
        ).fetchall()
        rows = [row._asdict() for row in obj]
        return rows 

    #  
    #  CRUD TOPIC15
    #

    def create_topic(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        sql_result = db.session.execute(text("INSERT INTO topics (title , study_id) VALUES (:title, :study_id) RETURNING id"),
            {"title": data.get("title"), 
             "study_id": data.get("study_id")}    
        )
        db.session.commit()
        return jsonify({"topic_id":str(sql_result.fetchone()[0])}) 
    
    def list_topics(self,study_id):
        user_id = get_jwt_identity()
        topics = db.session.execute(text("SELECT id, title, study_id FROM topics WHERE study_id = :study_id"),
            {"study_id": study_id}).fetchall()
        
        rows = [row._asdict() for row in topics]
        return rows 
    # =======================
    # CHAT CRUD
    # =======================
    def create_chat(self):
        data = request.get_json()
        user_id = get_jwt_identity()
        chat = db.session.execute(text("INSERT INTO chats (title,topic_id) VALUES (:title, :topic_id) RETURNING id"),
            {"title": data.get("title"),
             "topic_id": data.get("topic_id")}
        )
        db.session.commit()
        return jsonify({"chat_id": str(chat.fetchone()[0])})

    def list_chats(self,topic_id):
        user_id = get_jwt_identity()
        chats = db.session.execute(text("SELECT id, title, topic_id FROM chats WHERE topic_id = :topic_id"),
            {"topic_id": topic_id}).fetchall()
        rows = [row._asdict() for row in chats]
        return rows
    # =======================
    # MESSAGE CRUD
    # =======================
    
    def add_message(self,message):
        user_id = get_jwt_identity()
        result = db.session.execute(
            text("INSERT INTO messages (chat_id, author, message) VALUES (:chat_id, :author, :message) RETURNING id"),
        {
            "chat_id": message.get("chat_id"),
            "author": message.get("author"),
            "message": message.get("message")
        })
        db.session.commit()
        return str(result)

    def get_messages(self, chat_id):
        user_id = get_jwt_identity()
        messages = db.session.execute(
            text("SELECT id, author, message FROM messages WHERE chat_id = :chat_id "),
            {"chat_id" : chat_id })
        rows = [row._asdict() for row in messages]
        print(rows)
        return rows

db_service = db_service()
