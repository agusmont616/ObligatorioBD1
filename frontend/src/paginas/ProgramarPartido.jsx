import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useSesion } from "../Sesion.jsx";
import { api } from "../api.js";
import { useDatos, Encabezado, Error, fechaActual, fechaConDia, hora, useFormulario, useAccion } from "../componentes/ui.jsx";

const VACIO = {
  numero_fecha: "", id_equipo_local: "", id_equipo_visitante: "", dia: "", id_turno: "", cancha: "",
};

export default function ProgramarPartido() {
  const { id } = useParams();
  const navegar = useNavigate();
  const { idTorneo, torneo } = useSesion();
  const [equipos] = useDatos(idTorneo && "/equipos?id_torneo=" + idTorneo);
  const [partidos] = useDatos(idTorneo && "/partidos?id_torneo=" + idTorneo);
  const [turnos] = useDatos("/turnos");
  const [canchas] = useDatos("/canchas");
  const [complejos] = useDatos("/complejos");
  const [partido] = useDatos(id && "/partidos/" + id);
  const [form, cambiar, setForm] = useFormulario(VACIO);
  const [ocupacion] = useDatos(form.dia && "/ocupacion?dia=" + form.dia);
  const [ejecutar, error, ocupado] = useAccion();

  // al reprogramar cargo los datos del partido; si es nuevo propongo la fecha actual
  useEffect(() => {
    if (partido) {
      setForm({
        numero_fecha: partido.numero_fecha, id_equipo_local: String(partido.id_equipo_local),
        id_equipo_visitante: String(partido.id_equipo_visitante), dia: partido.dia,
        id_turno: String(partido.id_turno), cancha: `${partido.id_complejo}|${partido.nombre_cancha}`,
      });
    } else if (!id && partidos) {
      setForm((f) => ({ ...f, numero_fecha: fechaActual(partidos) }));
    }
  }, [partido, partidos === null]);

  const nombreComplejo = (idc) => (complejos || []).find((c) => c.id_complejo === idc)?.nombre || "";
  const ocupada = (idTurno, c) =>
    (ocupacion || []).some(
      (o) => o.id_turno === idTurno && o.id_complejo === c.id_complejo && o.nombre_cancha === c.nombre_cancha && o.id_partido !== Number(id)
    );

  // avisos en vivo antes de mandar
  const local = Number(form.id_equipo_local);
  const visitante = Number(form.id_equipo_visitante);
  const otros = (partidos || []).filter((p) => p.id_partido !== Number(id) && p.estado !== "cancelado");
  const avisos = [];
  if (local && local === visitante) avisos.push(["mal", "Un equipo no puede jugar contra sí mismo"]);
  if (local && visitante && local !== visitante) {
    const cruce = otros.some((p) =>
      (p.id_equipo_local === local && p.id_equipo_visitante === visitante) ||
      (p.id_equipo_local === visitante && p.id_equipo_visitante === local));
    avisos.push(cruce ? ["mal", "Estos equipos ya se enfrentaron en esta edición"] : ["ok", "Los equipos no se enfrentaron todavía"]);
    const yaJuega = otros.some((p) => p.numero_fecha === Number(form.numero_fecha) &&
      [p.id_equipo_local, p.id_equipo_visitante].some((e) => e === local || e === visitante));
    avisos.push(yaJuega ? ["mal", "Uno de los equipos ya juega en esa fecha"] : ["ok", "Ninguno juega otro partido en la fecha"]);
  }
  if (torneo && form.dia) {
    const dentro = form.dia >= torneo.fecha_inicio && form.dia <= torneo.fecha_fin;
    avisos.push(dentro ? ["ok", "El día está dentro de la edición"] : ["mal", "El día está fuera de las fechas de la edición"]);
  }
  if (form.cancha && form.id_turno) {
    const [idc, nombre] = form.cancha.split("|");
    const libre = !ocupada(Number(form.id_turno), { id_complejo: Number(idc), nombre_cancha: nombre });
    avisos.push(libre ? ["ok", "La cancha está libre en ese turno"] : ["mal", "La cancha ya está ocupada en ese turno"]);
  }

  async function guardar(e) {
    e.preventDefault();
    const [id_complejo, nombre_cancha] = form.cancha.split("|");
    const datos = {
      id_torneo: idTorneo, numero_fecha: Number(form.numero_fecha), id_equipo_local: local, id_equipo_visitante: visitante,
      dia: form.dia, id_turno: Number(form.id_turno), nombre_cancha, id_complejo: Number(id_complejo),
    };
    const ok = await ejecutar(() => (id ? api("/partidos/" + id, "PUT", datos) : api("/partidos", "POST", datos)));
    if (ok) navegar("/partidos");
  }

  return (
    <>
      <Encabezado ruta={<><Link to="/partidos">Partidos</Link> / {id ? "Reprogramar" : "Nuevo"}</>}
        titulo={id ? "Reprogramar partido" : "Programar partido"}
        sub={torneo ? `${torneo.nombre} ${torneo.anio} · ${torneo.semestre}° semestre` : ""} />

      <div className="grilla-lado">
        <form className="tarjeta formulario" onSubmit={guardar}>
          <h2>Datos del partido</h2>
          <div className="fila">
            <label>Edición<input value={torneo ? `${torneo.anio} · ${torneo.semestre}° semestre` : ""} disabled /></label>
            <label>Número de fecha<input type="number" min="1" value={form.numero_fecha} onChange={cambiar("numero_fecha")} required /></label>
          </div>
          <div className="fila">
            <label>Equipo local
              <select value={form.id_equipo_local} onChange={cambiar("id_equipo_local")} required>
                <option value="">Elegir...</option>
                {(equipos || []).map((e) => <option key={e.id_equipo} value={e.id_equipo}>{e.nombre}</option>)}
              </select>
            </label>
            <label>Equipo visitante
              <select value={form.id_equipo_visitante} onChange={cambiar("id_equipo_visitante")} required>
                <option value="">Elegir...</option>
                {(equipos || []).map((e) => <option key={e.id_equipo} value={e.id_equipo}>{e.nombre}</option>)}
              </select>
            </label>
          </div>
          <label>Día<input type="date" value={form.dia} onChange={cambiar("dia")} required /></label>

          <label>Turno</label>
          <div className="segmentado">
            {(turnos || []).map((t) => (
              <button type="button" key={t.id_turno} className={form.id_turno === String(t.id_turno) ? "activo" : ""}
                onClick={() => setForm({ ...form, id_turno: String(t.id_turno) })}>
                {hora(t.hora_inicio)}–{hora(t.hora_fin)}
              </button>
            ))}
          </div>

          <label>Cancha
            <select value={form.cancha} onChange={cambiar("cancha")} required>
              <option value="">Elegir...</option>
              {(canchas || []).map((c) => (
                <option key={c.id_complejo + c.nombre_cancha} value={`${c.id_complejo}|${c.nombre_cancha}`}>
                  {nombreComplejo(c.id_complejo)} · {c.nombre_cancha}
                </option>
              ))}
            </select>
          </label>

          <Error texto={error} />
          <div className="acciones">
            <Link className="boton boton-blanco" to="/partidos">Cancelar</Link>
            <button className="boton" disabled={ocupado || avisos.some((a) => a[0] === "mal")}>
              {id ? "Guardar cambios" : "Programar partido"}
            </button>
          </div>
        </form>

        <div>
          <div className="tarjeta">
            <h2>Validaciones del sistema</h2>
            {avisos.map(([tipo, texto]) => (
              <div key={texto} className={tipo === "ok" ? "texto-verde" : "texto-rojo"}>{tipo === "ok" ? "✓" : "✗"} {texto}</div>
            ))}
            {avisos.length === 0 && <div className="gris chico">Completá el formulario para ver las validaciones.</div>}
            <p className="chico gris">Además, el sistema exige que los dos equipos tengan al menos 5 jugadores.</p>
          </div>

          {form.dia && (
            <div className="tarjeta">
              <h2>Disponibilidad · {fechaConDia(form.dia)}</h2>
              <div className="tabla-scroll">
                <table className="tabla disponibilidad">
                  <thead>
                    <tr>
                      <th>Cancha</th>
                      {(turnos || []).map((t) => <th key={t.id_turno}>{hora(t.hora_inicio)}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {(canchas || []).map((c) => {
                      const valor = `${c.id_complejo}|${c.nombre_cancha}`;
                      return (
                        <tr key={valor}>
                          <td className="chico">{nombreComplejo(c.id_complejo)} · {c.nombre_cancha}</td>
                          {(turnos || []).map((t) => {
                            const elegida = form.cancha === valor && form.id_turno === String(t.id_turno);
                            const tomada = ocupada(t.id_turno, c);
                            return (
                              <td key={t.id_turno}>
                                <button type="button" disabled={tomada}
                                  className={"celda" + (tomada ? " celda-ocupada" : "") + (elegida ? " celda-elegida" : "")}
                                  onClick={() => setForm({ ...form, cancha: valor, id_turno: String(t.id_turno) })}>
                                  {tomada ? "Ocupada" : elegida ? "Elegida" : "Libre"}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
