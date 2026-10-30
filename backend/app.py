from flask import Flask, request
import consultas 


app = Flask(__name__)

@app.route("/torneos")
def torneos():
    return consultas.obtener_torneos()

@app.route("/torneos/<int:id_torneo>")
def torneos_id(id_torneo):
    torneo= consultas.obtener_torneo_por_id(id_torneo)
    if torneo is None:
        return {"error" : "Torneo no encontrado"}, 404
    
    return torneo

@app.route("/torneos", methods=["POST"])
def crear_torneo():
    datos = request.get_json(silent=True)
    if not isinstance(datos, dict):
        return {"error": "Debes enviar un JSON válido"}, 400
    campos = ["nombre", "anio", "semestre", "fecha_inicio", "fecha_fin", "estado"]
    for campo in campos:
        if campo not in datos:
            return{"error": f"Falta el campo {campo}"}, 500
    
    nuevo_id = consultas.crear_torneo(
        datos["nombre"],
        datos["anio"],
        datos["semestre"],
        datos["fecha_inicio"],
        datos["fecha_fin"],
        datos["estado"]
    )
    return {"id_torneo": nuevo_id}, 201

@app.route("/equipos")
def equipos():
    return consultas.obtener_equipos()

@app.route("/jugadores")
def jugadores():
    return consultas.obtener_jugadores()