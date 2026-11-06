import { useState } from "react";
import { useSesion } from "../Sesion.jsx";
import { api } from "../api.js";
import {
  useDatos, Cargando, Encabezado, Error, TIPOS, fechaActual, sancionVigente, useFormulario, useAccion,
} from "../componentes/ui.jsx";

const VACIO = { ci: "", nombre: "", apellido: "", email: "", fecha_nacimiento: "", id_facultad: "", tipo: "grado" };
const POR_PAGINA = 12;

export default function Jugadores() {
  const { idTorneo } = useSesion();
  const q = idTorneo ? "?id_torneo=" + idTorneo : null;
  const [jugadores, recargar, error] = useDatos(q && "/jugadores" + q);
  const [facultades] = useDatos("/facultades");
  const [partidos] = useDatos(q && "/partidos" + q);
  const [sanciones] = useDatos(q && "/sanciones" + q);

  const [busqueda, setBusqueda] = useState("");
  const [facultad, setFacultad] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(0);
  const [editando, setEditando] = useState(null);
  const [form, cambiar, setForm] = useFormulario(VACIO);
  const [ejecutar, errorAccion, ocupado, setErrorAccion] = useAccion();

  const fecha = fechaActual(partidos);
  const texto = busqueda.toLowerCase();
  const filtrados = (jugadores || []).filter(
    (j) =>
      (!texto || `${j.ci} ${j.nombre} ${j.apellido}`.toLowerCase().includes(texto)) &&
      (!facultad || j.id_facultad === Number(facultad)) &&
      (!tipo || j.tipo === tipo)
  );
  const paginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const visibles = filtrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);

  function nuevo() {
    setEditando("nuevo");
    setForm(VACIO);
    setErrorAccion("");
  }

  function editar(j) {
    setEditando(j.ci);
    setForm({ ...j, id_facultad: String(j.id_facultad) });
    setErrorAccion("");
  }

  async function guardar(e) {
    e.preventDefault();
    const datos = { ...form, id_facultad: Number(form.id_facultad) };
    const ok = await ejecutar(() =>
      editando === "nuevo" ? api("/jugadores", "POST", datos) : api("/jugadores/" + editando, "PUT", datos)
    );
    if (ok) {
      setEditando(null);
      recargar();
    }
  }

  async function borrar(j) {
    if (!confirm(`¿Borrar a ${j.nombre} ${j.apellido}?`)) return;
    if (await ejecutar(() => api("/jugadores/" + j.ci, "DELETE"))) recargar();
  }

  return (
    <>
      <Encabezado ruta="Gestión / Jugadores" titulo="Jugadores" sub={jugadores ? `${jugadores.length} jugadores registrados` : ""}>
        <button className="boton" onClick={nuevo}>+ Nuevo jugador</button>
      </Encabezado>
      {!editando && <Error texto={errorAccion} />}

      <div className={editando ? "grilla-lado" : ""}>
        <div className="tarjeta">
          <div className="filtros">
            <input placeholder="Buscar por CI, nombre o apellido" value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPagina(0); }} />
            <select value={facultad} onChange={(e) => { setFacultad(e.target.value); setPagina(0); }}>
              <option value="">Facultad: todas</option>
              {(facultades || []).map((f) => <option key={f.id_facultad} value={f.id_facultad}>{f.nombre}</option>)}
            </select>
            <select value={tipo} onChange={(e) => { setTipo(e.target.value); setPagina(0); }}>
              <option value="">Tipo: todos</option>
              {Object.entries(TIPOS).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>

          <Cargando datos={jugadores} error={error} />
          {jugadores && (
            <div className="tabla-scroll">
              <table className="tabla">
                <thead>
                  <tr><th>CI</th><th>Nombre</th><th>Email</th><th>Facultad</th><th>Tipo</th><th>Equipo</th><th>Estado</th><th></th></tr>
                </thead>
                <tbody>
                  {visibles.map((j) => {
                    const sancion = sancionVigente(sanciones, j.ci, fecha);
                    return (
                      <tr key={j.ci} className={editando === j.ci ? "fila-elegida" : ""}>
                        <td>{j.ci}</td>
                        <td className="negrita">{j.nombre} {j.apellido}</td>
                        <td className="gris">{j.email}</td>
                        <td>{j.facultad}</td>
                        <td><span className={"etiqueta tipo-" + j.tipo}>{TIPOS[j.tipo]}</span></td>
                        <td>{j.equipo || <span className="gris">—</span>}</td>
                        <td>
                          {sancion
                            ? <span className="etiqueta estado-cancelado">Suspendido</span>
                            : <span className="etiqueta estado-en-curso">Habilitado</span>}
                        </td>
                        <td className="derecha">
                          <button className="boton-chico" onClick={() => editar(j)}>Editar</button>
                          <button className="boton-chico peligro" disabled={ocupado} onClick={() => borrar(j)}>Borrar</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {filtrados.length === 0 && <div className="vacio">No hay jugadores con esos filtros.</div>}
            </div>
          )}

          <div className="paginado">
            <span className="gris chico">
              Mostrando {visibles.length} de {filtrados.length} jugadores
            </span>
            <div>
              {Array.from({ length: paginas }, (_, i) => (
                <button key={i} className={"pagina" + (i === pagina ? " activa" : "")} onClick={() => setPagina(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>

        {editando && (
          <form className="tarjeta formulario" onSubmit={guardar}>
            <h2>{editando === "nuevo" ? "Nuevo jugador" : "Editar jugador"}</h2>
            <label>Cédula de identidad
              <input value={form.ci} onChange={cambiar("ci")} disabled={editando !== "nuevo"} placeholder="7 u 8 números" required />
            </label>
            <div className="fila">
              <label>Nombre<input value={form.nombre} onChange={cambiar("nombre")} required /></label>
              <label>Apellido<input value={form.apellido} onChange={cambiar("apellido")} required /></label>
            </div>
            <label>Email<input type="email" value={form.email} onChange={cambiar("email")} required /></label>
            <div className="fila">
              <label>Fecha de nacimiento<input type="date" value={form.fecha_nacimiento} onChange={cambiar("fecha_nacimiento")} required /></label>
              <label>Facultad
                <select value={form.id_facultad} onChange={cambiar("id_facultad")} required>
                  <option value="">Elegir...</option>
                  {(facultades || []).map((f) => <option key={f.id_facultad} value={f.id_facultad}>{f.nombre}</option>)}
                </select>
              </label>
            </div>
            <label>Tipo de jugador</label>
            <div className="segmentado">
              {Object.entries(TIPOS).map(([v, t]) => (
                <button type="button" key={v} className={form.tipo === v ? "activo" : ""} onClick={() => setForm({ ...form, tipo: v })}>
                  {t}
                </button>
              ))}
            </div>
            <div className="nota">Docentes y funcionarios: máximo 2 por plantel.</div>
            <Error texto={errorAccion} />
            <div className="acciones">
              <button type="button" className="boton boton-blanco" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="boton" disabled={ocupado}>Guardar jugador</button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
