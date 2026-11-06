import { Link } from "react-router-dom";
import { useSesion } from "../Sesion.jsx";
import {
  useDatos, Cargando, Stat, Estado, fechaActual, fechaConDia, fechaCorta, hora, sancionVigente,
} from "../componentes/ui.jsx";

const PASOS = ["inscripcion", "en curso", "finalizado"];
const NOMBRES_PASOS = ["Inscripción", "En curso", "Finalizado"];

export default function Inicio() {
  const { torneo, idTorneo } = useSesion();
  const q = idTorneo ? "?id_torneo=" + idTorneo : null;
  const [partidos, , errorPartidos] = useDatos(q && "/partidos" + q);
  const [equipos] = useDatos(q && "/equipos" + q);
  const [sanciones] = useDatos(q && "/sanciones" + q);
  const [posiciones] = useDatos(q && "/reportes/posiciones" + q);

  if (!torneo) return <div className="gris">Cargando...</div>;
  if (!partidos || !equipos || !sanciones || !posiciones) return <Cargando datos={null} error={errorPartidos} />;

  const fecha = fechaActual(partidos);
  const deLaFecha = partidos.filter((p) => p.numero_fecha === fecha);
  const jugados = partidos.filter((p) => p.estado === "jugado");
  const goles = jugados.reduce((total, p) => total + p.goles_local + p.goles_visitante, 0);
  const suspendidos = sanciones.filter((s) => sancionVigente([s], s.ci_jugador, fecha));
  const sinPlanilla = partidos.filter((p) => p.estado === "programado" && p.terminado);
  const incompletos = equipos.filter((e) => e.jugadores < 5);
  const paso = PASOS.indexOf(torneo.estado);

  return (
    <>
      <div className="gris chico">Panel principal</div>
      <h1 className="titulo">Inicio</h1>

      <div className="banner">
        <div>
          <h2>{torneo.nombre} · {torneo.semestre}° semestre {torneo.anio}</h2>
          <div className="banner-datos">
            <span>Fecha {fecha}</span>
            <span>{equipos.length} equipos</span>
            <span>{partidos.length} partidos</span>
            <span>{fechaCorta(torneo.fecha_inicio)} – {fechaCorta(torneo.fecha_fin)}</span>
          </div>
          <div className="acciones">
            <Link className="boton boton-amarillo" to="/partidos">Ver fixture</Link>
            <Link className="boton boton-blanco" to="/reportes">Tabla de posiciones</Link>
          </div>
        </div>
        <div className="pasos">
          {NOMBRES_PASOS.map((nombre, i) => (
            <div key={nombre} className={"paso" + (i < paso ? " hecho" : "") + (i === paso ? " actual" : "")}>
              <div className="paso-punto">{i < paso ? "✓" : i + 1}</div>
              <div className="chico">{nombre}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grilla-4">
        <Stat valor={equipos.length} texto="Equipos inscriptos" detalle="con planteles cargados" />
        <Stat valor={`${jugados.length} / ${partidos.length}`} texto="Partidos jugados" detalle={`hasta la fecha ${fecha}`} />
        <Stat valor={goles} texto="Goles convertidos" detalle="en partidos jugados" />
        <Stat valor={suspendidos.length} texto="Jugadores suspendidos" detalle={`para la fecha ${fecha}`} tono="rojo" />
      </div>

      <div className="grilla-inicio">
        <div className="tarjeta">
          <h2>Partidos de la fecha {fecha}</h2>
          {deLaFecha.map((p) => (
            <div key={p.id_partido} className="partido-fila">
              <div className="partido-dia">
                <div className="negrita">{fechaConDia(p.dia)}</div>
                <div className="chico">{hora(p.hora_inicio)}</div>
              </div>
              <div className="partido-equipos">
                <div className="negrita">
                  {p.local} <span className="gris">vs</span> {p.visitante}
                </div>
                <div className="gris chico">{p.complejo} · {p.nombre_cancha}</div>
              </div>
              {p.estado === "jugado" ? (
                <span className="marcador">{p.goles_local} - {p.goles_visitante}</span>
              ) : p.estado === "programado" && p.terminado ? (
                <span className="etiqueta estado-pendiente">Planilla pendiente</span>
              ) : (
                <Estado estado={p.estado} />
              )}
            </div>
          ))}
          {deLaFecha.length === 0 && <div className="vacio">No hay partidos cargados para esta fecha.</div>}
          <Link to="/partidos" className="link chico">Ver fixture completo →</Link>
        </div>

        <div className="tarjeta">
          <h2>Tabla de posiciones</h2>
          <table className="tabla tabla-compacta">
            <thead>
              <tr><th>#</th><th>Equipo</th><th>PJ</th><th>PTS</th></tr>
            </thead>
            <tbody>
              {posiciones.slice(0, 6).map((f, i) => (
                <tr key={f.id_equipo}>
                  <td>{i + 1}</td>
                  <td>{f.equipo}</td>
                  <td>{f.PJ}</td>
                  <td className="negrita">{f.PTS}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {posiciones.length === 0 && <div className="vacio">Todavía no hay partidos jugados.</div>}
        </div>

        <div className="tarjeta">
          <h2>Alertas</h2>
          {suspendidos.length > 0 && (
            <div className="alerta alerta-error">
              {suspendidos.length} jugador(es) suspendidos para la fecha {fecha}
              {suspendidos.slice(0, 3).map((s) => (
                <div key={s.id_sancion} className="chico">· {s.nombre} {s.apellido} ({s.equipo})</div>
              ))}
            </div>
          )}
          {sinPlanilla.length > 0 && (
            <div className="alerta alerta-amarilla">
              {sinPlanilla.length} partido(s) terminados sin marcar como jugados
              <div className="chico"><Link to="/planillas">Ir a planillas →</Link></div>
            </div>
          )}
          {incompletos.length > 0 && (
            <div className="alerta alerta-amarilla">
              {incompletos.length} equipo(s) con menos de 5 jugadores
              {incompletos.map((e) => <div key={e.id_equipo} className="chico">· {e.nombre}</div>)}
            </div>
          )}
          {suspendidos.length + sinPlanilla.length + incompletos.length === 0 && (
            <div className="alerta alerta-verde">Todo en orden, no hay alertas.</div>
          )}
        </div>
      </div>
    </>
  );
}
