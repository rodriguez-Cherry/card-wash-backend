import { DataBase } from "../db/index.js";

const db = new DataBase().getDB();

export async function obtenerEquiposDisponibles(fecha, hora_inicio, hora_fin) {
  const subquery = db("equipo_vehiculo_cita as ec")
    .join("citas as c", "ec.cita_id", "c.cita_id")
    .where("c.fecha", fecha)
    .where("c.hora_inicio", hora_inicio)
    .where("c.hora_fin", hora_fin)
    .select("ec.equipo_id");

  const equipos = await db("equipos as e")
    .whereNotIn("e.equipo_id", subquery)
    .select("e.equipo_id")
    .orderBy("e.equipo_id", "asc");

  const equiposIds = equipos.map((e) => e.equipo_id);

  return {
    equiposDisponibles: equiposIds,
    canditad: equiposIds?.length,
  };
}
