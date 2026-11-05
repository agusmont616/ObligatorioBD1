// todas las llamadas al backend pasan por aca
export async function api(ruta, metodo = "GET", datos) {
  const opciones = { method: metodo, credentials: "include", headers: {} };
  if (datos !== undefined) {
    opciones.headers["Content-Type"] = "application/json";
    opciones.body = JSON.stringify(datos);
  }
  const respuesta = await fetch("/api" + ruta, opciones);
  const json = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(json?.error || "Error " + respuesta.status);
  }
  return json;
}
