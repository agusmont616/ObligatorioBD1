import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSesion } from "../Sesion.jsx";
import { api } from "../api.js";
import {
  useDatos, Cargando, Encabezado, Error, Estado, ESTADOS_PARTIDO, fechaActual, fechaConDia, hora, useAccion,
} from "../componentes/ui.jsx";

export default function Partidos() {
  const { idTorneo, torneo } = useSesion();
  const [partidos, recargar, error] = useDatos(idTorneo && "/partidos?id_torneo=" + idTorneo);
  const [fecha, setFecha] = useState(null);
  const [estado, setEstado] = useState("");
  const [ejecutar, errorAccion, ocupado] = useAccion();

  useEffect(() => {
    if (partidos) setFecha(fechaActual(partidos));
  }, [partidos === null, idTorneo]);

  const fechas = [...new Set((partidos || []).map((p) => p.numero_fecha))].sort((a, b) => a - b);
  const deLaFecha = (partidos || []).filter((p) => p.numero_fecha === fecha && (!estado || p.estado === estado));
  const suspendidos = (partidos || []).filter((p) => p.estado === "postergado").length;

  async function cambiarEstado(p, nuevo) {
    if (await ejecutar(() => api(`/partidos/${p.id_partido}/estado`, "PUT", { estado: nuevo }))) recargar();
  }

  async function borrar(p) {
    if (!confirm(`¿Borrar ${p.local} vs ${p.visitante}?`)) return;
    if (await ejecutar(() => api("/partidos/" + p.id_partido, "DELETE"))) recargar();
  }

  return (
    <>
      <Encabezado ruta="Gestión / Partidos" titulo="Partidos / Fixture"
        sub={partidos ? `${fechas.length} fechas · ${partidos.length} partidos` : ""}>
        {torneo?.estado !== "finalizado" && <Link className="boton" to="/partidos/nuevo">+ Programar partido</Link>}
      </Encabezado>
      <Error texto={errorAccion} />
      <Cargando datos={partidos} error={error} />

      {partidos && (
        <>
          <div className="filtros">
            <div className="pestanas">
              {fechas.map((f) => (
                <button key={f} className={"pestana" + (f === fecha ? " activa" : "")} onClick={() => setFecha(f)}>
                  Fecha {f}
                </button>
              ))}
            </div>
            <select value={estado} onChange={(e) => setEstado(e.target.value)}>
              <option value="">Estado: todos</option>
              {Object.entries(ESTADOS_PARTIDO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          {suspendidos > 0 && (
            <div className="alerta alerta-amarilla">{suspendidos} partido(s) postergados: hay que reprogramarlos.</div>
          )}

          <div className="tarjeta">
            <h2>Fecha {fecha}</h2>
            {deLaFecha.map((p) => (
              <div key={p.id_partido} className="partido-fila">
                <div className="partido-dia">
                  <div className="negrita">{fechaConDia(p.dia)}</div>
                  <div className="chico">{hora(p.hora_inicio)}</div>
                </div>
                <div className="partido-equipos">
                  <div className="partido-vs">
                    <span className="negrita derecha">{p.local}</span>
                    {p.estado === "jugado"
                      ? <span className="marcador">{p.goles_local} - {p.goles_visitante}</span>
                      : <span className="gris">vs</span>}
                    <span className="negrita">{p.visitante}</span>
                  </div>
                  <div className="gris chico centro">{p.complejo} · {p.nombre_cancha}</div>
                </div>
                <div className="partido-acciones">
                  {p.estado === "programado" && p.terminado
                    ? <span className="etiqueta estado-pendiente">Planilla pendiente</span>
                    : <Estado estado={p.estado} />}
                  {p.estado !== "jugado" && (
                    <>
                      <select value="" disabled={ocupado} onChange={(e) => cambiarEstado(p, e.target.value)}>
                        <option value="">Cambiar estado…</option>
                        {p.estado === "programado" && <option value="postergado">Postergar</option>}
                        {p.estado !== "cancelado" && <option value="cancelado">Cancelar</option>}
                      </select>
                      <Link className="boton-chico" to={`/partidos/${p.id_partido}/editar`}>Reprogramar</Link>
                      <button className="boton-chico peligro" disabled={ocupado} onClick={() => borrar(p)}>Borrar</button>
                    </>
                  )}
                  {(p.estado === "jugado" || p.estado === "programado") && (
                    <Link className="boton-chico" to={"/planilla/" + p.id_partido}>Planilla</Link>
                  )}
                </div>
              </div>
            ))}
            {deLaFecha.length === 0 && <div className="vacio">No hay partidos para mostrar.</div>}
          </div>
          <p className="chico gris">El resultado se calcula a partir de los goles cargados en la planilla. Un partido jugado no se puede borrar ni reprogramar.</p>
        </>
      )}
    </>
  );
}
