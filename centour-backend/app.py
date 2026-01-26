import os
from flask import Flask
from flask_cors import CORS

from src.db_interaction.db_route import study_bp
from src.core_mechanism.extensions import db,jwt
from src.llm_interaction.llm_route import llm_bp
from src.auth.auth_route import auth_bp

from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
app = Flask(__name__)

CORS(app, 
    supports_credentials=True,
    resources={r"/*": {"origins": ["http://localhost:5173","https://centour-ai.vercel.app/"]}},
    allow_headers=["Authorization", "Content-Type"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    )

# Blueprint’leri kaydet
app.register_blueprint(study_bp)
app.register_blueprint(llm_bp)
app.register_blueprint(auth_bp)

app.config["JWT_SECRET_KEY"] = os.environ["JWT_SECRET_KEY"]

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ['POSTGRESQL_URI']
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

jwt.init_app(app)
db.init_app(app)

if __name__ == "__main__":
    app.run(debug=True, port=5000)