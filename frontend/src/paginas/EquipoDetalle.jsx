import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import { useDatos, Cargando, Encabezado, Error, Estado, TIPOS, useAccion } from "../componentes/ui.jsx";

export default function EquipoDetalle() {
  const { id } = useParams();
  const navegar = useNavigate();
  const [equipo, recargarEquipo, error] = useDatos("/equipos/" + id);
  const [plantel, recargarPlantel] = useDatos("/equipos/" + id + "/jugadores");
  const [torneo] = useDatos(equipo && "/torneos/" + equipo.id_torneo);
  const [jugadores, recargarJugadores] = useDatos(equipo && "/jugadores?id_torneo=" + equipo.id_torneo);
  const [facultades] = useDatos("/facultades");
  const [ejecutar, errorAccion, ocupado] = useAccion();

  const [nombre, setNombre] = useState("");
  const [capitan, setCapitan] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [nuevo, setNuevo] = useState("");
  const [camiseta, setCamiseta] = useState("");

  useEffect(() => {
    if (equipo) {
      setNombre(equipo.nombre);
      setCapitan(equipo.ci_capitan);
    }
  }, [equipo]);

  if (!equipo || !plantel) return <Cargando datos={null} error={error} />;

  const editable = torneo?.estado === "inscripcion";
  const facultad = (facultades || []).find((f) => f.id_facultad === equipo.id_facultad);
  const docentes = plantel.filter((j) => j.tipo === "docente" || j.tipo === "funcionario").length;
  const texto = busqueda.toLowerCase();
  const candidatos = (jugadores || []).filter(
    (j) => !j.id_equipo && j.id_facultad === equipo.id_facultad &&
      (!texto || `${j.ci} ${j.nombre} ${j.apellido}`.toLowerCase().includes(texto))
  );

  function recargar() {
    recargarEquipo();
    recargarPlantel();
    recargarJugadores();
  }

  async function guardar() {
    if (await ejecutar(() => api("/equipos/" + id, "PUT", { nombre, ci_capitan: capitan }))) recargar();
  }

  async function agregar(e) {
    e.preventDefault();
    const ok = await ejecutar(() =>
      api(`/equipos/${id}/jugadores`, "POST", { ci_jugador: nuevo, numero_camiseta: Number(camiseta) })
    );
    if (ok) {
      setNuevo("");
      setCamiseta("");
      recargar();
    }
  }

  async function quitar(j) {
    if (!confirm(`¿Quitar a ${j.nombre} ${j.apellido} del plantel?`)) return;
    if (await ejecutar(() => api(`/equipos/${id}/jugadores/${j.ci}`, "DELETE"))) recargar();
  }

  async function borrarEquipo() {
    if (!confirm(`¿Eliminar el equipo ${equipo.nombre}? También se vacía su plantel.`)) return;
    if (await ejecutar(() => api("/equipos/" + id, "DELETE"))) navegar("/equipos");
  }

  return (
    <>
      <Encabezado ruta={<><Link to="/equipos">Equipos</Link> / {equipo.nombre}</>} titulo={equipo.nombre}
        sub={torneo ? `${torneo.nombre} ${torneo.anio} · ${torneo.semestre}° semestre` : ""}>
        {torneo && <Estado estado={torneo.estado} />}
      </Encabezado>

      {!editable && torneo && (
        <div className="alerta alerta-amarilla">El torneo está {torneo.estado}: el plantel no puede modificarse.</div>
      )}
      <Error texto={errorAccion} />

      <div className="grilla-lado grilla-lado-izq">
        <div className="tarjeta formulario">
          <h2>Datos del equipo</h2>
          <label>Nombre del equipo<input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={!editable} /></label>
          <label>Facultad<input value={facultad?.nombre || ""} disabled /></label>
          <p className="chico gris">La facultad no se puede cambiar porque el plantel depende de ella.</p>
          <label>Capitán
            <select value={capitan} onChange={(e) => setCapitan(e.target.value)} disabled={!editable}>
              {plantel.map((j) => <option key={j.ci} value={j.ci}>{j.nombre} {j.apellido} ({j.ci})</option>)}
            </select>
          </label>
          <p className="chico gris">Tiene que ser parte del plantel.</p>
          {editable && (
            <div className="acciones">
              <button className="boton boton-peligro" disabled={ocupado} onClick={borrarEquipo}>Eliminar equipo</button>
              <button className="boton" disabled={ocupado} onClick={guardar}>Guardar</button>
            </div>
          )}
        </div>

        <div className="tarjeta">
          <div className="pagina-encabezado">
            <h2>Plantel · {plantel.length} / 10 jugadores</h2>
          </div>

          {editable && (
            <form className="agregar" onSubmit={agregar}>
              <input placeholder="Buscar jugador de la facultad" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
              <select value={nuevo} onChange={(e) => setNuevo(e.target.value)} required>
                <option value="">Elegir jugador ({candidatos.length} disponibles)</option>
                {candidatos.map((j) => <option key={j.ci} value={j.ci}>{j.nombre} {j.apellido} · {TIPOS[j.tipo]}</option>)}
              </select>
              <input type="number" min="1" max="99" placeholder="N°" value={camiseta} onChange={(e) => setCamiseta(e.target.value)} required className="input-chico" />
              <button className="boton" disabled={ocupado}>+ Agregar</button>
            </form>
          )}

          <table className="tabla">
            <thead>
              <tr><th>N°</th><th>CI</th><th>Nombre</th><th>Tipo</th><th>Capitán</th><th></th></tr>
            </thead>
            <tbody>
              {[...plantel].sort((a, b) => a.numero_camiseta - b.numero_camiseta).map((j) => (
                <tr key={j.ci}>
                  <td className="negrita">{j.numero_camiseta}</td>
                  <td>{j.ci}</td>
                  <td>{j.nombre} {j.apellido}</td>
                  <td><span className={"etiqueta tipo-" + j.tipo}>{TIPOS[j.tipo]}</span></td>
                  <td>{j.ci === equipo.ci_capitan && <span className="etiqueta estado-inscripcion">C</span>}</td>
                  <td className="derecha">
                    {editable && j.ci !== equipo.ci_capitan && (
                      <button className="boton-chico peligro" disabled={ocupado} onClick={() => quitar(j)}>Quitar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="chips">
            <span className={plantel.length >= 5 && plantel.length <= 10 ? "chip-ok" : "chip-mal"}>
              {plantel.length >= 5 ? "✓" : "✗"} Jugadores (mín. 5, máx. 10)
            </span>
            <span className={docentes <= 2 ? "chip-ok" : "chip-mal"}>✓ Docentes/funcionarios {docentes}/2</span>
            <span className="chip-ok">✓ Todos de {facultad?.nombre}</span>
          </div>
        </div>
      </div>
    </>
  );
}
