import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useDatos, Cargando, Encabezado, Error, useFormulario, useAccion } from "../componentes/ui.jsx";

const DEPARTAMENTOS = [
  "Artigas", "Canelones", "Cerro Largo", "Colonia", "Durazno", "Flores", "Florida", "Lavalleja", "Maldonado",
  "Montevideo", "Paysandú", "Río Negro", "Rivera", "Rocha", "Salto", "San José", "Soriano", "Tacuarembó", "Treinta y Tres",
];
const SUPERFICIES = { sintetico: "Sintético", parquet: "Parquet" };

export default function Complejos() {
  const [complejos, recargarComplejos, error] = useDatos("/complejos");
  const [canchas, recargarCanchas] = useDatos("/canchas");
  const [elegido, setElegido] = useState(null);
  const [form, cambiar, setForm] = useFormulario({ nombre: "", direccion: "", departamento: "Montevideo" });
  const [cancha, cambiarCancha, setCancha] = useFormulario({ nombre_cancha: "", superficie: "sintetico", techada: false });
  const [ejecutar, errorAccion, ocupado] = useAccion();

  // al cargar elijo el primero
  useEffect(() => {
    if (complejos && complejos.length && elegido === null) elegir(complejos[0]);
  }, [complejos]);

  function elegir(c) {
    setElegido(c ? c.id_complejo : "nuevo");
    setForm(c ? { nombre: c.nombre, direccion: c.direccion, departamento: c.departamento } : { nombre: "", direccion: "", departamento: "Montevideo" });
  }

  const actual = (complejos || []).find((c) => c.id_complejo === elegido);
  const suyas = (canchas || []).filter((c) => c.id_complejo === elegido);

  async function guardarComplejo(e) {
    e.preventDefault();
    const ok = await ejecutar(async () => {
      if (elegido === "nuevo") {
        const r = await api("/complejos", "POST", form);
        setElegido(r.id_complejo);
      } else {
        await api("/complejos/" + elegido, "PUT", form);
      }
    });
    if (ok) recargarComplejos();
  }

  async function borrarComplejo() {
    if (!confirm(`¿Eliminar el complejo ${actual.nombre}?`)) return;
    if (await ejecutar(() => api("/complejos/" + elegido, "DELETE"))) {
      setElegido(null);
      recargarComplejos();
    }
  }

  async function agregarCancha(e) {
    e.preventDefault();
    const ok = await ejecutar(() => api("/canchas", "POST", { ...cancha, id_complejo: elegido }));
    if (ok) {
      setCancha({ nombre_cancha: "", superficie: "sintetico", techada: false });
      recargarCanchas();
    }
  }

  async function modificarCancha(c, cambios) {
    const datos = { superficie: c.superficie, techada: !!c.techada, ...cambios };
    if (await ejecutar(() => api(`/canchas/${c.id_complejo}/${encodeURIComponent(c.nombre_cancha)}`, "PUT", datos))) recargarCanchas();
  }

  async function borrarCancha(c) {
    if (!confirm(`¿Eliminar ${c.nombre_cancha}?`)) return;
    if (await ejecutar(() => api(`/canchas/${c.id_complejo}/${encodeURIComponent(c.nombre_cancha)}`, "DELETE"))) recargarCanchas();
  }

  return (
    <>
      <Encabezado ruta="Gestión / Complejos" titulo="Complejos y canchas" sub="Complejos deportivos donde se disputan los partidos">
        <button className="boton" onClick={() => elegir(null)}>+ Nuevo complejo</button>
      </Encabezado>
      <Error texto={errorAccion} />
      <Cargando datos={complejos} error={error} />

      <div className="grilla-lado grilla-lado-izq">
        <div className="tarjeta">
          <h2>Complejos</h2>
          {(complejos || []).map((c) => (
            <button key={c.id_complejo} className={"item" + (c.id_complejo === elegido ? " item-activo" : "")} onClick={() => elegir(c)}>
              <div className="negrita">{c.nombre}</div>
              <div className="chico gris">{c.direccion} · {c.departamento}</div>
              <div className="chico gris">{(canchas || []).filter((x) => x.id_complejo === c.id_complejo).length} canchas</div>
            </button>
          ))}
        </div>

        <div>
          <form className="tarjeta formulario" onSubmit={guardarComplejo}>
            <h2>{elegido === "nuevo" ? "Nuevo complejo" : "Datos del complejo"}</h2>
            <div className="fila">
              <label>Nombre<input value={form.nombre} onChange={cambiar("nombre")} required /></label>
              <label>Departamento
                <select value={form.departamento} onChange={cambiar("departamento")}>
                  {DEPARTAMENTOS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </label>
            </div>
            <label>Dirección<input value={form.direccion} onChange={cambiar("direccion")} required /></label>
            <div className="acciones">
              {actual && <button type="button" className="boton boton-peligro" disabled={ocupado} onClick={borrarComplejo}>Eliminar</button>}
              <button className="boton" disabled={ocupado}>{elegido === "nuevo" ? "Crear complejo" : "Guardar cambios"}</button>
            </div>
          </form>

          {actual && (
            <div className="tarjeta">
              <h2>Canchas de {actual.nombre}</h2>
              <table className="tabla">
                <thead>
                  <tr><th>Cancha</th><th>Superficie</th><th>Techada</th><th></th></tr>
                </thead>
                <tbody>
                  {suyas.map((c) => (
                    <tr key={c.nombre_cancha}>
                      <td className="negrita">{c.nombre_cancha}</td>
                      <td>
                        <select value={c.superficie} onChange={(e) => modificarCancha(c, { superficie: e.target.value })}>
                          {Object.entries(SUPERFICIES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                        </select>
                      </td>
                      <td>
                        <input type="checkbox" checked={!!c.techada} onChange={(e) => modificarCancha(c, { techada: e.target.checked })} />
                      </td>
                      <td className="derecha">
                        <button className="boton-chico peligro" disabled={ocupado} onClick={() => borrarCancha(c)}>Borrar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {suyas.length === 0 && <div className="vacio">Este complejo todavía no tiene canchas.</div>}

              <form className="agregar" onSubmit={agregarCancha}>
                <input placeholder="Nueva cancha" value={cancha.nombre_cancha} onChange={cambiarCancha("nombre_cancha")} required />
                <select value={cancha.superficie} onChange={cambiarCancha("superficie")}>
                  {Object.entries(SUPERFICIES).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                </select>
                <label className="check"><input type="checkbox" checked={cancha.techada} onChange={cambiarCancha("techada")} /> Techada</label>
                <button className="boton" disabled={ocupado}>+ Agregar</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
