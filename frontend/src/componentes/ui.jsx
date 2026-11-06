import { useEffect, useState } from "react";
import { api } from "../api.js";

// trae datos de la api y deja recargarlos despues de un cambio
export function useDatos(ruta) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [vuelta, setVuelta] = useState(0);

  useEffect(() => {
    if (!ruta) return;
    let vigente = true;
    setError("");
    api(ruta)
      .then((d) => vigente && setDatos(d))
      .catch((e) => vigente && setError(e.message));
    return () => {
      vigente = false;
    };
  }, [ruta, vuelta]);

  return [datos, () => setVuelta((v) => v + 1), error];
}

// '2026-11-09' -> '09/11'
export function fechaCorta(dia) {
  if (!dia) return "";
  const [, m, d] = dia.split("-");
  return `${d}/${m}`;
}

// '2026-11-09' -> 'lun 09/11'
export function fechaConDia(dia) {
  if (!dia) return "";
  const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
  return dias[new Date(dia + "T12:00").getDay()] + " " + fechaCorta(dia);
}

// '18:00:00' -> '18:00'
export function hora(texto) {
  return texto ? texto.slice(0, 5) : "";
}

export function nombreCompleto(j) {
  return j ? `${j.nombre} ${j.apellido}` : "";
}

// la fecha que se esta jugando: la primera con partidos programados
export function fechaActual(partidos) {
  if (!partidos || partidos.length === 0) return 1;
  const programados = partidos.filter((p) => p.estado === "programado").map((p) => p.numero_fecha);
  if (programados.length) return Math.min(...programados);
  return Math.max(...partidos.map((p) => p.numero_fecha)) + 1;
}

export function sancionVigente(sanciones, ci, fecha) {
  return (sanciones || []).find(
    (s) => s.ci_jugador === ci && fecha >= s.numero_fecha_inicio && fecha < s.numero_fecha_inicio + s.cantidad_fechas
  );
}

export const TIPOS = { grado: "Grado", posgrado: "Posgrado", docente: "Docente", funcionario: "Funcionario" };
export const MOTIVOS = { roja: "Roja", "acumulacion de amarillas": "3 amarillas", disciplinaria: "Disciplinaria" };
export const ESTADOS_PARTIDO = {
  programado: "Programado",
  jugado: "Jugado",
  postergado: "Postergado",
  cancelado: "Cancelado",
};

export function Estado({ estado }) {
  const texto = ESTADOS_PARTIDO[estado] || { inscripcion: "Inscripción", "en curso": "En curso", finalizado: "Finalizado" }[estado] || estado;
  return <span className={"etiqueta estado-" + estado.replace(" ", "-")}>{texto}</span>;
}

export function Encabezado({ ruta, titulo, sub, children }) {
  return (
    <div className="pagina-encabezado">
      <div>
        {ruta && <div className="gris chico">{ruta}</div>}
        <h1 className="titulo">{titulo}</h1>
        {sub && <div className="gris chico">{sub}</div>}
      </div>
      {children && <div className="acciones">{children}</div>}
    </div>
  );
}

export function Error({ texto }) {
  return texto ? <div className="alerta alerta-error">{texto}</div> : null;
}

export function Cargando({ datos, error }) {
  if (error) return <Error texto={error} />;
  if (datos === null) return <div className="gris">Cargando...</div>;
  return null;
}

export function Stat({ valor, texto, detalle, tono }) {
  return (
    <div className={"tarjeta stat" + (tono ? " stat-" + tono : "")}>
      <div className="stat-valor">{valor}</div>
      <div>
        <div className="negrita">{texto}</div>
        {detalle && <div className="gris chico">{detalle}</div>}
      </div>
    </div>
  );
}

// barras horizontales de una sola serie
export function Barras({ filas, etiqueta, valor, formato = (v) => v, unidad = "" }) {
  const maximo = Math.max(1, ...filas.map(valor));
  return (
    <div className="barras">
      {filas.map((f, i) => (
        <div key={i} className="barra-fila" title={`${etiqueta(f)}: ${formato(valor(f))}${unidad}`}>
          <div className="barra-etiqueta">{etiqueta(f)}</div>
          <div className="barra-pista">
            <div className="barra" style={{ width: (valor(f) / maximo) * 100 + "%" }} />
          </div>
          <div className="barra-valor">{formato(valor(f))}</div>
        </div>
      ))}
      {filas.length === 0 && <div className="vacio">Sin datos todavía.</div>}
    </div>
  );
}

// formulario controlado simple: [valores, cambiar('campo'), setValores]
export function useFormulario(inicial) {
  const [valores, setValores] = useState(inicial);
  const cambiar = (campo) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setValores((anterior) => ({ ...anterior, [campo]: v }));
  };
  return [valores, cambiar, setValores];
}

// ejecuta una accion contra la api y muestra el error si falla
export function useAccion() {
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  async function ejecutar(funcion) {
    setError("");
    setOcupado(true);
    try {
      await funcion();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setOcupado(false);
    }
  }
  return [ejecutar, error, ocupado, setError];
}
