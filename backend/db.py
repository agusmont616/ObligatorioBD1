import os
import mysql.connector
from dotenv import load_dotenv

# Carga el .env si existe (desarrollo local)
load_dotenv()

DB_USERS = {
    "auth":          (os.getenv("DB_AUTH_USER"),  os.getenv("DB_AUTH_PASS")),
    "administrador": (os.getenv("DB_ADMIN_USER"), os.getenv("DB_ADMIN_PASS")),
    "planillero":    (os.getenv("DB_PLAN_USER"),  os.getenv("DB_PLAN_PASS")),
}

def get_conn(rol):
    user, password = DB_USERS[rol]
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database="torneo",
        user=user,
        password=password,
        port=int(os.getenv("DB_PORT", "3306")),
    )
