import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSesion } from "../Sesion.jsx";
import Logo from "../componentes/Logo.jsx";

export default function Login() {
  const { entrar } = useSesion();
  const navegar = useNavigate();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await entrar(correo, contrasena);
      navegar("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="login">
      <div className="login-cancha">
        <span className="etiqueta estado-en-curso">Temporada 2026</span>
        <div className="login-cartel">
          <h2>Torneo Interfacultades de Fútbol 5</h2>
          <p>Fixture, resultados, planillas, sanciones y reportes en un único sistema para la organización del torneo.</p>
        </div>
      </div>

      <div className="login-lado">
        <form className="login-form" onSubmit={enviar}>
          <Logo />
          <h1>Iniciar sesión</h1>
          <p className="gris">Ingresá con tu correo institucional</p>

          <label>
            Correo
            <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </label>
          <label>
            Contraseña
            <input type="password" value={contrasena} onChange={(e) => setContrasena(e.target.value)} required />
          </label>

          {error && <div className="alerta alerta-error">{error}</div>}

          <button className="boton" disabled={enviando}>
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="nota">
            <b>Dos perfiles de acceso</b>
            <br />
            Administrador: gestiona toda la información del torneo.
            <br />
            Planillero: registra planillas, goles y tarjetas.
          </div>
        </form>
      </div>
    </div>
  );
}
