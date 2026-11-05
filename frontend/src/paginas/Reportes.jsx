import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useSesion } from "../Sesion.jsx";

const PESTANAS = ["Posiciones", "Goleadores y Fair Play", "Estadísticas de partidos", "Jugadores y sanciones"];

export default function Reportes() {
  const [pestana, setPestana] = useState(PESTANAS[0]);

  return (
    <>
      <div className="gris chico">Reportes</div>
      <h1 className="titulo">Reportes</h1>

      <div className="pestanas">
        {PESTANAS.map((p) => (
          <button key={p} className={p === pestana ? "pestana activa" : "pestana"} onClick={() => setPestana(p)}>
            {p}
          </button>
        ))}
      </div>

      {pestana === "Posiciones" ? <Posiciones /> : <div className="tarjeta vacio">Pestaña en construcción.</div>}
    </>
  );
}

function Posiciones() {
  const { idTorneo } = useSesion();
  const [filas, setFilas] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!idTorneo) return;
    setError("");
    api("/reportes/posiciones?id_torneo=" + idTorneo)
      .then(setFilas)
      .catch((e) => setError(e.message));
  }, [idTorneo]);

  if (error) return <div className="alerta alerta-error">{error}</div>;

  const lider = filas[0];
  const masGoleador = [...filas].sort((a, b) => b.GF - a.GF)[0];
  const mejorDefensa = [...filas].sort((a, b) => a.GC - b.GC)[0];

  return (
    <>
      <div className="tarjeta">
        <h2>Tabla de posiciones</h2>
        <p className="gris chico">Orden: puntos → diferencia de gol → goles a favor</p>
        <table className="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Equipo</th>
              <th>PJ</th>
              <th>PG</th>
              <th>PE</th>
              <th>PP</th>
              <th>GF</th>
              <th>GC</th>
              <th>DG</th>
              <th>PTS</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f, i) => (
              <tr key={f.equipo} className={i === 0 ? "fila-lider" : ""}>
                <td>{i + 1}</td>
                <td className="negrita">{f.equipo}</td>
                <td>{f.PJ}</td>
                <td>{f.PG}</td>
                <td>{f.PE}</td>
                <td>{f.PP}</td>
                <td>{f.GF}</td>
                <td>{f.GC}</td>
                <td>{f.DG > 0 ? "+" + f.DG : f.DG}</td>
                <td className="negrita">{f.PTS}</td>
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan="10" className="vacio">Todavía no hay partidos jugados en esta edición.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {lider && (
        <div className="grilla-3">
          <Destacado titulo="Líder" equipo={lider.equipo} detalle={lider.PTS + " puntos"} />
          <Destacado titulo="Mejor ataque" equipo={masGoleador.equipo} detalle={masGoleador.GF + " goles a favor"} />
          <Destacado titulo="Mejor defensa" equipo={mejorDefensa.equipo} detalle={mejorDefensa.GC + " goles en contra"} />
        </div>
      )}
    </>
  );
}

function Destacado({ titulo, equipo, detalle }) {
  return (
    <div className="tarjeta destacado">
      <div className="gris chico">{titulo}</div>
      <div className="negrita">{equipo}</div>
      <div className="gris chico">{detalle}</div>
    </div>
  );
}
