import { Link } from "react-router-dom";
import { useSesion } from "../Sesion.jsx";
import { useDatos, Cargando, Encabezado, Estado, fechaConDia, hora } from "../componentes/ui.jsx";

export default function MisPartidos() {
  const { idTorneo } = useSesion();
  const [partidos, , error] = useDatos(idTorneo && "/partidos?id_torneo=" + idTorneo);

  // pendientes: ya terminaron y se pueden cargar (sin marcar jugados o dentro de las 48 horas)
  const pendientes = (partidos || []).filter((p) => p.terminado && (p.estado === "programado" || (p.estado === "jugado" && p.en_plazo)));
  const proximos = (partidos || []).filter((p) => !p.terminado && p.estado === "programado");
  const registrados = (partidos || []).filter((p) => p.estado === "jugado" && !p.en_plazo).reverse().slice(0, 8);

  return (
    <>
      <Encabezado ruta="Planillas" titulo="Partidos para planillar" sub="Partidos para registrar la planilla de juego" />
      <div className="nota">
        Las planillas se cargan cuando termina el partido. Las correcciones se permiten hasta 48 horas después.
      </div>
      <Cargando datos={partidos} error={error} />

      {partidos && (
        <>
          <div className="tarjeta">
            <h2>Pendientes de planilla</h2>
            {pendientes.map((p) => (
              <div key={p.id_partido} className="partido-fila partido-destacado">
                <div className="partido-dia oscuro">
                  <div className="negrita">{fechaConDia(p.dia)}</div>
                  <div className="chico">{hora(p.hora_inicio)}</div>
                </div>
                <div className="partido-equipos">
                  <div className="negrita">{p.local} <span className="gris">vs</span> {p.visitante}</div>
                  <div className="gris chico">{p.complejo} · {p.nombre_cancha} · Fecha {p.numero_fecha}</div>
                  <div className="chico">
                    {p.estado === "jugado"
                      ? <span className="etiqueta estado-jugado">Jugado · se puede corregir</span>
                      : <span className="etiqueta estado-pendiente">Planilla pendiente</span>}{" "}
                    <span className="gris">{p.en_planilla} jugadores en planilla</span>
                  </div>
                </div>
                <Link className="boton" to={"/planilla/" + p.id_partido}>Registrar planilla</Link>
              </div>
            ))}
            {pendientes.length === 0 && <div className="vacio">No hay planillas pendientes.</div>}
          </div>

          <div className="tarjeta">
            <h2>Próximos</h2>
            {proximos.map((p) => (
              <div key={p.id_partido} className="partido-fila">
                <div className="partido-dia">
                  <div className="negrita">{fechaConDia(p.dia)}</div>
                  <div className="chico">{hora(p.hora_inicio)}</div>
                </div>
                <div className="partido-equipos">
                  <div className="negrita">{p.local} <span className="gris">vs</span> {p.visitante}</div>
                  <div className="gris chico">{p.complejo} · {p.nombre_cancha} · Fecha {p.numero_fecha}</div>
                </div>
                <Link className="boton-chico" to={"/planilla/" + p.id_partido}>Preparar planilla</Link>
              </div>
            ))}
            {proximos.length === 0 && <div className="vacio">No hay partidos próximos.</div>}
          </div>

          <div className="tarjeta">
            <h2>Registradas</h2>
            <table className="tabla">
              <thead><tr><th>Fecha</th><th>Partido</th><th>Resultado</th><th>Estado</th><th></th></tr></thead>
              <tbody>
                {registrados.map((p) => (
                  <tr key={p.id_partido}>
                    <td>{fechaConDia(p.dia)} · {hora(p.hora_inicio)}</td>
                    <td>{p.local} vs {p.visitante}</td>
                    <td className="negrita">{p.goles_local} – {p.goles_visitante}</td>
                    <td><Estado estado={p.estado} /> <span className="chico gris">cerrada</span></td>
                    <td className="derecha"><Link className="link chico" to={"/planilla/" + p.id_partido}>Ver planilla →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {registrados.length === 0 && <div className="vacio">Todavía no hay planillas cerradas.</div>}
          </div>
        </>
      )}
    </>
  );
}
