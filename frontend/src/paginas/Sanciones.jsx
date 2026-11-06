import { useState } from "react";
import { useSesion } from "../Sesion.jsx";
import { api } from "../api.js";
import {
  useDatos, Cargando, Encabezado, Error, Stat, MOTIVOS, fechaActual, useFormulario, useAccion,
} from "../componentes/ui.jsx";

export default function Sanciones() {
  const { idTorneo } = useSesion();
  const q = idTorneo ? "?id_torneo=" + idTorneo : null;
  const [sanciones, recargar, error] = useDatos(q && "/sanciones" + q);
  const [jugadores] = useDatos(q && "/jugadores" + q);
  const [partidos] = useDatos(q && "/partidos" + q);
  const [motivo, setMotivo] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [form, cambiar, setForm] = useFormulario({ ci_jugador: "", numero_fecha_inicio: "", cantidad_fechas: 1 });
  const [ejecutar, errorAccion, ocupado] = useAccion();

  const fecha = fechaActual(partidos);
  const lista = (sanciones || []).filter((s) => !motivo || s.motivo === motivo);
  const vigente = (s) => fecha >= s.numero_fecha_inicio && fecha < s.numero_fecha_inicio + s.cantidad_fechas;
  const cuenta = (m) => (sanciones || []).filter((s) => s.motivo === m).length;
  const texto = busqueda.toLowerCase();
  const inscriptos = (jugadores || []).filter(
    (j) => j.id_equipo && (!texto || `${j.ci} ${j.nombre} ${j.apellido}`.toLowerCase().includes(texto))
  );

  async function crear(e) {
    e.preventDefault();
    const datos = {
      ci_jugador: form.ci_jugador, id_torneo: idTorneo, motivo: "disciplinaria",
      numero_fecha_inicio: Number(form.numero_fecha_inicio || fecha), cantidad_fechas: Number(form.cantidad_fechas),
    };
    if (await ejecutar(() => api("/sanciones", "POST", datos))) {
      setForm({ ci_jugador: "", numero_fecha_inicio: "", cantidad_fechas: 1 });
      recargar();
    }
  }

  async function borrar(s) {
    if (!confirm(`¿Borrar la sanción de ${s.nombre} ${s.apellido}?`)) return;
    if (await ejecutar(() => api("/sanciones/" + s.id_sancion, "DELETE"))) recargar();
  }

  return (
    <>
      <Encabezado ruta="Gestión / Sanciones" titulo="Sanciones" sub="Automáticas (roja y 3 amarillas) y disciplinarias" />
      <Error texto={errorAccion} />

      <div className="grilla-4">
        <Stat valor={(sanciones || []).length} texto="Sanciones en la edición" />
        <Stat valor={cuenta("roja")} texto="Por tarjeta roja" tono="rojo" />
        <Stat valor={cuenta("acumulacion de amarillas")} texto="Por 3 amarillas" tono="amarillo" />
        <Stat valor={cuenta("disciplinaria")} texto="Disciplinarias" />
      </div>

      <div className="grilla-lado">
        <div className="tarjeta">
          <div className="pagina-encabezado">
            <h2>Sanciones de la edición</h2>
            <select value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              <option value="">Motivo: todos</option>
              {Object.entries(MOTIVOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
          <Cargando datos={sanciones} error={error} />
          {sanciones && (
            <table className="tabla">
              <thead>
                <tr><th>Jugador</th><th>Equipo</th><th>Motivo</th><th>Desde</th><th>Fechas</th><th>Hasta</th><th>Estado</th><th></th></tr>
              </thead>
              <tbody>
                {lista.map((s) => (
                  <tr key={s.id_sancion}>
                    <td className="negrita">{s.nombre} {s.apellido}</td>
                    <td>{s.equipo || "—"}</td>
                    <td><span className={"etiqueta motivo-" + s.motivo.split(" ")[0]}>{MOTIVOS[s.motivo]}</span></td>
                    <td>F{s.numero_fecha_inicio}</td>
                    <td>{s.cantidad_fechas}</td>
                    <td>F{s.numero_fecha_inicio + s.cantidad_fechas - 1}</td>
                    <td>
                      {vigente(s) ? <span className="etiqueta estado-cancelado">Vigente</span>
                        : fecha < s.numero_fecha_inicio ? <span className="etiqueta estado-inscripcion">Próxima</span>
                        : <span className="etiqueta estado-finalizado">Cumplida</span>}
                    </td>
                    <td className="derecha">
                      {s.motivo === "disciplinaria" && (
                        <button className="boton-chico peligro" disabled={ocupado} onClick={() => borrar(s)}>Borrar</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {sanciones && lista.length === 0 && <div className="vacio">No hay sanciones.</div>}
          <p className="chico gris">Las sanciones por tarjetas las genera el sistema al cargarlas en la planilla; se corrigen borrando la tarjeta.</p>
        </div>

        <form className="tarjeta formulario" onSubmit={crear}>
          <h2>Nueva sanción disciplinaria</h2>
          <input placeholder="Buscar jugador" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <label>Jugador
            <select value={form.ci_jugador} onChange={cambiar("ci_jugador")} required>
              <option value="">Elegir...</option>
              {inscriptos.map((j) => <option key={j.ci} value={j.ci}>{j.nombre} {j.apellido} ({j.equipo})</option>)}
            </select>
          </label>
          <div className="fila">
            <label>Desde la fecha<input type="number" min="1" placeholder={String(fecha)} value={form.numero_fecha_inicio} onChange={cambiar("numero_fecha_inicio")} /></label>
            <label>Cantidad de fechas<input type="number" min="1" value={form.cantidad_fechas} onChange={cambiar("cantidad_fechas")} required /></label>
          </div>
          <div className="nota">
            El jugador no va a poder figurar en planillas desde la fecha {form.numero_fecha_inicio || fecha} hasta la{" "}
            {Number(form.numero_fecha_inicio || fecha) + Number(form.cantidad_fechas || 1) - 1}.
          </div>
          <button className="boton" disabled={ocupado}>Aplicar sanción</button>
        </form>
      </div>
    </>
  );
}
