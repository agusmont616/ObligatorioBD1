import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useSesion } from "../Sesion.jsx";
import { api } from "../api.js";
import { useDatos, Cargando, Error, Estado, fechaConDia, hora, sancionVigente, useAccion } from "../componentes/ui.jsx";

export default function Planilla() {
  const { id } = useParams();
  const { usuario } = useSesion();
  const [partido, recargarPartido, error] = useDatos("/partidos/" + id);
  const [planilla, recargarPlanilla] = useDatos("/partidos/" + id + "/planilla");
  const [goles, recargarGoles] = useDatos("/partidos/" + id + "/goles");
  const [tarjetas, recargarTarjetas] = useDatos("/partidos/" + id + "/tarjetas");
  const [plantelLocal] = useDatos(partido && "/equipos/" + partido.id_equipo_local + "/jugadores");
  const [plantelVisita] = useDatos(partido && "/equipos/" + partido.id_equipo_visitante + "/jugadores");
  const [sanciones, recargarSanciones] = useDatos(partido && "/sanciones?id_torneo=" + partido.id_torneo);
  const [ejecutar, errorAccion, ocupado] = useAccion();

  const [gol, setGol] = useState({ ci_jugador: "", minuto: "", autogol: false });
  const [tarjeta, setTarjeta] = useState({ ci_jugador: "", minuto: "", color: "amarilla" });

  if (!partido || !planilla || !goles || !tarjetas) return <Cargando datos={null} error={error} />;

  const cerrada = partido.estado === "jugado" && !partido.en_plazo;
  const editable = !cerrada && (partido.estado === "programado" || partido.estado === "jugado");
  const enPlanilla = (ci) => planilla.some((p) => p.ci_jugador === ci);
  const esAdmin = usuario.rol === "administrador";

  function recargar() {
    recargarPartido();
    recargarPlanilla();
    recargarGoles();
    recargarTarjetas();
    recargarSanciones();
  }

  async function alternar(j, idEquipo) {
    const ok = await ejecutar(() =>
      enPlanilla(j.ci)
        ? api(`/partidos/${id}/planilla/${j.ci}`, "DELETE")
        : api(`/partidos/${id}/planilla`, "POST", { ci_jugador: j.ci, id_equipo: idEquipo })
    );
    if (ok) recargar();
  }

  async function agregarGol(e) {
    e.preventDefault();
    const ok = await ejecutar(() => api(`/partidos/${id}/goles`, "POST", { ...gol, minuto: Number(gol.minuto) }));
    if (ok) {
      setGol({ ci_jugador: "", minuto: "", autogol: false });
      recargar();
    }
  }

  async function agregarTarjeta(e) {
    e.preventDefault();
    const ok = await ejecutar(() => api(`/partidos/${id}/tarjetas`, "POST", { ...tarjeta, minuto: Number(tarjeta.minuto) }));
    if (ok) {
      setTarjeta({ ci_jugador: "", minuto: "", color: "amarilla" });
      recargar();
    }
  }

  async function borrar(ruta) {
    if (await ejecutar(() => api(ruta, "DELETE"))) recargar();
  }

  async function marcarJugado() {
    if (!confirm("¿Confirmar la planilla y marcar el partido como jugado?")) return;
    if (await ejecutar(() => api(`/partidos/${id}/estado`, "PUT", { estado: "jugado" }))) recargar();
  }

  const opcionesPlanilla = planilla.map((p) => (
    <option key={p.ci_jugador} value={p.ci_jugador}>
      #{p.numero_camiseta} {p.nombre} {p.apellido} ({p.id_equipo === partido.id_equipo_local ? partido.local : partido.visitante})
    </option>
  ));

  return (
    <>
      <div className="gris chico">
        <Link to={esAdmin ? "/planillas" : "/mis-partidos"}>Planillas</Link> / Registro de planilla
      </div>
      <h1 className="titulo">Registro de planilla</h1>

      <div className="marcador-grande">
        <div className="marcador-equipos">
          <span>{partido.local}</span>
          <span className="marcador-numeros">{partido.goles_local} – {partido.goles_visitante}</span>
          <span>{partido.visitante}</span>
        </div>
        <div className="chico">
          {fechaConDia(partido.dia)} · {hora(partido.hora_inicio)}–{hora(partido.hora_fin)} · {partido.complejo} · {partido.nombre_cancha} · Fecha {partido.numero_fecha}
        </div>
        <div className="chico">Resultado calculado a partir de los goles cargados · <Estado estado={partido.estado} /></div>
      </div>

      {cerrada && <div className="alerta alerta-amarilla">Pasaron más de 48 horas del partido: la planilla está cerrada.</div>}
      {!partido.terminado && partido.estado === "programado" && (
        <div className="nota">El partido todavía no terminó: podés armar la planilla, pero goles y tarjetas se cargan al terminar.</div>
      )}
      <Error texto={errorAccion} />

      <div className="grilla-planilla">
        {[
          [partido.id_equipo_local, partido.local, plantelLocal],
          [partido.id_equipo_visitante, partido.visitante, plantelVisita],
        ].map(([idEquipo, nombre, plantel]) => (
          <div key={idEquipo} className="tarjeta">
            <h2>{nombre}</h2>
            <div className="chico gris">{planilla.filter((p) => p.id_equipo === idEquipo).length} en planilla</div>
            {[...(plantel || [])].sort((a, b) => a.numero_camiseta - b.numero_camiseta).map((j) => {
              const sancion = sancionVigente(sanciones, j.ci, partido.numero_fecha);
              const marcado = enPlanilla(j.ci);
              return (
                <label key={j.ci} className={"jugador-check" + (sancion && !marcado ? " suspendido" : "")}>
                  <input type="checkbox" checked={marcado} disabled={!editable || ocupado || (sancion && !marcado)}
                    onChange={() => alternar(j, idEquipo)} />
                  <span className="negrita">#{j.numero_camiseta}</span>
                  <span>{j.nombre} {j.apellido}</span>
                  {sancion && <span className="etiqueta estado-cancelado">Suspendido</span>}
                </label>
              );
            })}
          </div>
        ))}

        <div>
          <div className="tarjeta">
            <h2>⚽ Goles</h2>
            {goles.map((g) => (
              <div key={g.id_gol} className="evento">
                <span className="negrita">{g.minuto}'</span>
                <span className="evento-nombre">{g.nombre} {g.apellido}{g.autogol ? " (en contra)" : ""}</span>
                {editable && <button className="boton-chico peligro" onClick={() => borrar("/goles/" + g.id_gol)}>✕</button>}
              </div>
            ))}
            {goles.length === 0 && <div className="gris chico">Sin goles.</div>}
            {editable && partido.terminado && (
              <form className="formulario separado" onSubmit={agregarGol}>
                <select value={gol.ci_jugador} onChange={(e) => setGol({ ...gol, ci_jugador: e.target.value })} required>
                  <option value="">Jugador...</option>
                  {opcionesPlanilla}
                </select>
                <div className="fila">
                  <input type="number" min="0" max="60" placeholder="Min." value={gol.minuto} onChange={(e) => setGol({ ...gol, minuto: e.target.value })} required />
                  <label className="check"><input type="checkbox" checked={gol.autogol} onChange={(e) => setGol({ ...gol, autogol: e.target.checked })} /> En contra</label>
                  <button className="boton" disabled={ocupado}>+</button>
                </div>
              </form>
            )}
          </div>

          <div className="tarjeta">
            <h2>🟨 Tarjetas</h2>
            {tarjetas.map((t) => (
              <div key={t.id_tarjeta} className="evento">
                <span className="negrita">{t.minuto}'</span>
                <span className={"tarjeta-color " + t.color} />
                <span className="evento-nombre">{t.nombre} {t.apellido}</span>
                {editable && esAdmin && <button className="boton-chico peligro" onClick={() => borrar("/tarjetas/" + t.id_tarjeta)}>✕</button>}
              </div>
            ))}
            {tarjetas.length === 0 && <div className="gris chico">Sin tarjetas.</div>}
            {editable && partido.terminado && (
              <form className="formulario separado" onSubmit={agregarTarjeta}>
                <select value={tarjeta.ci_jugador} onChange={(e) => setTarjeta({ ...tarjeta, ci_jugador: e.target.value })} required>
                  <option value="">Jugador...</option>
                  {opcionesPlanilla}
                </select>
                <div className="fila">
                  <input type="number" min="0" max="60" placeholder="Min." value={tarjeta.minuto} onChange={(e) => setTarjeta({ ...tarjeta, minuto: e.target.value })} required />
                  <div className="segmentado">
                    {["amarilla", "roja"].map((c) => (
                      <button type="button" key={c} className={tarjeta.color === c ? "activo" : ""} onClick={() => setTarjeta({ ...tarjeta, color: c })}>
                        <span className={"tarjeta-color " + c} />
                      </button>
                    ))}
                  </div>
                  <button className="boton" disabled={ocupado}>+</button>
                </div>
              </form>
            )}
            <p className="chico gris">Una roja o la 3ª amarilla generan una sanción automática de 1 fecha.{!esAdmin && " Solo el administrador puede borrar tarjetas."}</p>
          </div>
        </div>
      </div>

      {partido.estado === "programado" && partido.terminado && (
        <div className="pie-acciones">
          <span className="chico gris">Al confirmar, el partido pasa a “jugado” y suma a la tabla de posiciones. Se puede corregir hasta 48 horas después.</span>
          <button className="boton" disabled={ocupado} onClick={marcarJugado}>✓ Confirmar y marcar como jugado</button>
        </div>
      )}
    </>
  );
}
