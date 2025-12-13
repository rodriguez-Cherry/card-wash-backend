import { DataBase } from "../db/index.js";

const db = new DataBase().getDB();
export const conserguirCitasConUsuarioyCarros = async () => {
  const rows = await db("citas as c")
    .join("carro_cita as cc", "cc.cita_id", "c.cita_id")
    .join("carros as ca", "ca.placa", "cc.placa")
    .join("usuarios as u", "u.id", "ca.user_id")
    .join("servicios as se", "se.servicio_id", "c.servicio_id")
    .select(
      "c.estado",
      "c.cita_id as cita_id",
      "c.fecha",
      "c.hora_inicio",
      "se.tipo",
      "se.precio",
      "se.tiempo_estimado",

      "u.id as user_id",
      "u.nombre as user_nombre",
      "u.apellido",
      "u.email as user_email",

      "ca.placa",
    );

  const citas = {};

  for (const row of rows) {
    if (!citas[row.cita_id]) {
      citas[row.cita_id] = {
        cita_id: row.cita_id,
        fecha: row.fecha,
        estado: row.estado,
        hora_inicio: row.hora_inicio,
        precio: row.precio,
        tipo: row.tipo,
        tiempo_estimado: row.tiempo_estimado,
        usuario: {
          id: row.user_id,
          nombre: row.user_nombre,
          apellido: row.apellido,
          email: row.user_email,
        },
        carros_placas: [],
      };
    }

    citas[row.cita_id].carros_placas.push(row.placa);
  }

  return Object.values(citas);
};
