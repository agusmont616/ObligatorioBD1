import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api.js";

const SesionContext = createContext(null);

// guarda el usuario logueado y el torneo elegido arriba
export function SesionProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [torneos, setTorneos] = useState([]);
  const [idTorneo, setIdTorneo] = useState(null);

  useEffect(() => {
    api("/sesion")
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    if (!usuario) return;
    api("/torneos").then((lista) => {
      setTorneos(lista);
      // por defecto el que esta en curso
      const enCurso = lista.find((t) => t.estado === "en curso") || lista[lista.length - 1];
      if (enCurso) setIdTorneo(enCurso.id_torneo);
    });
  }, [usuario]);

  // despues de crear o cambiar un torneo
  function recargarTorneos() {
    api("/torneos").then(setTorneos);
  }

  async function entrar(correo, contrasena) {
    const u = await api("/login", "POST", { correo, contrasena });
    setUsuario(u);
    return u;
  }

  async function salir() {
    await api("/logout", "POST");
    setUsuario(null);
    setTorneos([]);
    setIdTorneo(null);
  }

  const torneo = torneos.find((t) => t.id_torneo === idTorneo) || null;

  return (
    <SesionContext.Provider
      value={{ usuario, cargando, entrar, salir, torneos, torneo, idTorneo, setIdTorneo, recargarTorneos }}
    >
      {children}
    </SesionContext.Provider>
  );
}

export function useSesion() {
  return useContext(SesionContext);
}
