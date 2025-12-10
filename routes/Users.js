import { Router } from "express";
import { DataBase } from "../db/index.js";
import { verifyToken } from "../utils/verificarToken.js";
import { obtenerEquiposDisponibles } from "../utils/obtenerEquiposDisponibles.js";
import crypto from "crypto"

const db = new DataBase().getDB();
export const routerUsers = Router();

routerUsers.get("/car/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  console.log("id car", id);
  try {
    const carros = await db("carros").where({ user_id: id }).select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerUsers.get("/car-por-id/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const carro = await db("carros").where({ id }).select("*").first();
    return res.status(200).json({
      data: carro,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error" });
  }
});

routerUsers.get("/servicios", async (req, res) => {
  try {
    const servicios = await db("servicios")
      .select("*")
      .orderBy("precio", "asce");
    return res.status(200).json({
      data: servicios,
    });
  } catch (error) {}
});

routerUsers.post("/add-car", verifyToken, async (req, res) => {
  const { placa, color, marca, modelo, user_id, año } = req.body;
  try {
    const car = {
      placa,
      color,
      marca,
      modelo,
      user_id,
      año,
    };

    await db("carros").insert(car);
    res.status(200).json("Added");
  } catch (error) {
    console.log(error);
  }
});

// TODO
routerUsers.get("/citas/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const citas = await db("citas as ci")
      .where("ci.user_id", userId)
      .leftJoin("servicios as se", "ci.servicio_id", "se.id")
      .leftJoin("usuarios as us", "ci.user_id", "us.id")
      .select(
        "ci.*",
        "se.tipo",
        "se.precio",
        "se.tiempo_estimado",
        "us.telefono"
      );
    // .join("carros as ca", "ci.user_id", "ca.user_id")
    // .join("servicios as se", "ci.servicio_id", "se.id")

    return res.status(200).json({
      data: citas,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Error ");
  }
});

// TODO
routerUsers.post("/agendar", async (req, res) => {
  const { fecha, hora_inicio, hora_fin, estado, carro_placas, servicio_id } =
    req.body || {};

  if (
    !fecha ||
    !hora_inicio ||
    !hora_fin ||
    !carro_placas?.length ||
    !servicio_id
  ) {
    return res.status(400).json("Payload invalido");
  }

  try {
      const uuid = crypto.randomUUID();

    // insertar en citas tabla
    const cita = await db("citas")
      .insert({
        cita_id: uuid,
        fecha,
        hora_inicio,
        hora_fin,
        estado,
        servicio_id,
      })

    // insertar carros en carro cita tabla
    carro_placas.forEach(async (placa) => {
      await db("carro_cita").insert({
        placa,
        cita_id: uuid,
      });
    });

    // insertar equipo_id, cita_id y placa en equipo_vehiculo_cita tabla
    const { equiposDisponibles } = await obtenerEquiposDisponibles(
      fecha,
      hora_inicio,
      hora_fin
    );

    for (let index = 0; index < carro_placas.length; index++) {
      const equipo_id = equiposDisponibles[index];
      const placa = carro_placas[index];

      await db("equipo_vehiculo_cita ").insert({
        equipo_id,
        placa,
        cita_id: uuid,
      });
    }

    return res.status(200).json("Cita agendata");
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json("Error al agendar su servicio Intente mas tarde");
  }
});

// TODO
routerUsers.delete("/eliminar-cita/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json("No id proveido");
  }
  try {
    await db("citas").delete().where({ id });
    res.status(200).json("deleted");
  } catch (error) {
    console.log(error);
    res.status(500).json("Error al eliminar su orden Intente mas tarde");
  }
});

// TODO
routerUsers.put("/update-car/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { color, marca, modelo, user_id, año, estado } = req.body;
  if (!id) {
    return res.status(400).json({
      data: "No carro id proveido",
    });
  }
  try {
    const todasCitas = await db("citas").select("*");

    const todasCitasActivas = todasCitas.filter((todaActiva) =>
      ["pendiente", "en proceso"].includes(todaActiva?.estado)
    );

    const citasRelacionadas = todasCitasActivas?.filter((citas) =>
      citas.carros_ids.includes(id)
    );

    if (citasRelacionadas.length > 0) {
      citasRelacionadas.forEach(async (cita) => {
        const citaActualizada = {
          ...cita,
          estado: "cancelado",
        };
        await db("citas").update(citaActualizada).where({ id: cita.id });
      });
    }

    const payload = { color, marca, modelo, user_id, año, estado };
    await db("carros").where({ id }).update(payload);
    res.status(200).json("Carro actualizado!");
  } catch (error) {
    return res.status(500).json({
      data: "No pudo ser actualizado!",
    });
  }
});
// TODO
routerUsers.put("/actualizar-carro/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { placa, color, marca, modelo, user_id, año } = req.body;
  if (!id) {
    return res.status(400).json({
      data: "No carro id proveido",
    });
  }
  try {
    const payload = { placa, color, marca, modelo, user_id, año };
    await db("carros").where({ id }).update(payload);
    res.status(200).json("Carro actualizado!");
  } catch (error) {
    return res.status(500).json({
      data: "No pudo ser actualizado!",
    });
  }
});

// TODO
routerUsers.delete("/eliminar-carro/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { color, marca, modelo, user_id, año } = req.body;
  if (!id) {
    return res.status(400).json({
      data: "No carro id proveido",
    });
  }
  try {
    const todasCitas = await db("citas").select("*");

    const todasCitasActivas = todasCitas.filter((todaActiva) =>
      ["pendiente", "en proceso"].includes(todaActiva?.estado)
    );

    const citasRelacionadas = todasCitasActivas?.filter((citas) =>
      citas.carros_ids.includes(id)
    );

    if (citasRelacionadas.length > 0) {
      citasRelacionadas.forEach(async (cita) => {
        const citaActualizada = {
          ...cita,
          estado: "cancelado",
        };
        await db("citas").update(citaActualizada).where({ id: cita.id });
      });
    }

    const payload = { color, marca, modelo, user_id, año, estado };
    await db("carros").where({ id }).update(payload);
    res.status(200).json("Carro actualizado!");
  } catch (error) {
    return res.status(500).json({
      data: "No pudo ser actualizado!",
    });
  }
});

routerUsers.get("/horarios-disponibles", async (req, res) => {
  const { fecha, hora_inicio, hora_fin } = req.body || {};


  if (!fecha || !hora_fin || !hora_inicio)
    return res.status(400).json("payload invalido");

  try {
    const { equiposDisponibles, canditad } = await obtenerEquiposDisponibles(
      fecha,
      hora_inicio,
      hora_fin
    );
    res.status(200).json({
      equipos: equiposDisponibles,
      canditad,
    });
  } catch (error) {}
});
