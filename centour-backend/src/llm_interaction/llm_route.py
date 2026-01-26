# routes/llm_routes.py
from flask import Blueprint, request, jsonify, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.db_interaction.db_service import db_service
from src.llm_interaction.llm_service import llm_service
import json

llm_bp = Blueprint("llm", __name__)

@llm_bp.route("/messages", methods=["POST"])
@jwt_required()
def chat_with_llm():
    user_id = get_jwt_identity()
    data = request.get_json()
    chat_id = data.get("chat_id")
        
    if not chat_id:
        return jsonify({"error": "chat_id eksik"}), 400

    user_message = data.get("content")

    if not user_message:
        return jsonify({"error": "content eksik"}), 400

    # Kullanıcının mesajını DB'ye kaydet
    db_service.add_message({
        "chat_id": chat_id,
        "author": "user",
        "message": user_message,
        "owner_user_id": user_id
    })

    list_placeholder = db_service.get_messages(chat_id)

    if isinstance(list_placeholder, dict):
        print("list_placeholder is a dict, converting to list")
        messages = [list_placeholder]  # dict ise listeye sar
    elif isinstance(list_placeholder, list):
        messages = list_placeholder  # Zaten liste ise doğrudan kullan
    else:
        messages = []  # Beklenmeyen bir türse boş liste ata

    print("Fetched messages from DB:", list_placeholder)
    print("Messages list:", messages)

    # Döngü içinde öğelerin dict olduğundan emin ol
    for m in messages:
        if isinstance(m, dict):
            m["chat_id"] = str(m.get("chat_id"))
            m["id"] = str(m.get("id"))
            m["author"] = m.get("author")
            m["message"] = m.get("message")
        else:
            print("Unexpected message format:", m)
    # LLM cevabını al
    def generate():
        print("1. generate içi")
        full_response = ""
        
        try:
            # LLM'den streaming cevap al
            for chunk in llm_service.ask_stream(messages):
                full_response += chunk
                # Her chunk'ı SSE formatında gönder
                yield f"data: {json.dumps({'chunk': chunk, 'done': False})}\n\n"
            
            # Tüm cevap tamamlandığında DB'ye kaydet
            db_service.add_message({
                "chat_id": chat_id,
                "author": "system",
                "message": full_response,
                "owner_user_id": user_id
            })
            
            # Son mesaj - bitti işareti
            yield f"data: {json.dumps({'chunk': '', 'done': True, 'full_response': full_response})}\n\n"
            
        except Exception as e:
            error_msg = f"⚠️ Hata: {str(e)}"
            yield f"data: {json.dumps({'error': error_msg, 'done': True})}\n\n"
    
    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',  # Nginx için
            'Connection': 'keep-alive'
        }
    )

    # LLM cevabını DB'ye kaydet
    db_service.add_message({
        "chat_id": chat_id,
        "author": "system",
        "message": answer,
        "owner_user_id": user_id
    })

    return jsonify({"reply": answer})