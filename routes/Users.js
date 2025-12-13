import { Router } from "express";
import { DataBase } from "../db/index.js";
import { verifyToken } from "../utils/verificarToken.js";
import {
  obtenerCarrosAgendados,
  obtenerEquiposDisponibles,
} from "../utils/obtenerEquiposDisponibles.js";
import crypto from "crypto";

const db = new DataBase().getDB();
export const routerUsers = Router();

// Done FE
routerUsers.get("/car/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const carros = await db("carros").where({ user_id: id }).select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});
// Done FE
routerUsers.get("/car-por-placa/:placa", verifyToken, async (req, res) => {
  const { placa } = req.params;

  try {
    const carro = await db("carros").where({ placa }).select("*").first();
    return res.status(200).json({
      data: carro,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error" });
  }
});
// Done FE
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
// Done FE
routerUsers.post("/add-car", async (req, res) => {
  const { placa, color, marca, modelo, user_id, año } = req.body;

  if (!placa || !color || !marca || !modelo || !user_id || !año)
    return res.status(400).json("Payload invalido");

  try {
    const placaExistente = await db("carros").where({ placa }).select("placa");

    if (!placaExistente) {
      return res.status(400).json("Este placa ya existe");
    }

    const car = {
      placa,
      color,
      marca,
      modelo,
      user_id,
      año,
    };

    await db("carros").insert(car);
    res.status(200).json("Carro agregado");
  } catch (error) {
    console.log(error);
  }
});

// Done FE
routerUsers.post("/horarios-disponibles", async (req, res) => {
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

// Done FE
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
    await db("citas").insert({
      cita_id: uuid,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      servicio_id,
    });

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

      await db("equipo_vehiculo_cita").insert({
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

// Done FE
routerUsers.delete("/eliminar-cita/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json("No id proveido");
  }
  try {
    await db("carro_cita").delete().where({ cita_id: id });
    await db("equipo_vehiculo_cita").delete().where({ cita_id: id });
    await db("citas").delete().where({ cita_id: id });

    return res.status(200).json("Cita Eliminada!");
  } catch (error) {
    console.log(error);
    return res.status(500).json("Error al eliminar su orden Intente mas tarde");
  }
});

// Done FE
routerUsers.get("/citas/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const rows = await db("citas as c")
      .join("carro_cita as cc", "cc.cita_id", "c.cita_id")
      .join("carros as ca", "ca.placa", "cc.placa")
      .join("servicios as se", "se.servicio_id", "c.servicio_id")
      .where("ca.user_id", userId)
      .select("c.*", "se.tipo", "se.precio", "se.tiempo_estimado", "ca.placa")
      .distinct();

    const citas = {};

    for (const row of rows) {
      if (!citas[row.cita_id]) {
        citas[row.cita_id] = {
          cita_id: row.cita_id,
          fecha: row.fecha,
          hora_inicio: row.hora_inicio,
          estado: row.estado,
          precio: row.precio,
          tipo: row.tipo,
          tiempo_estimado: row.tiempo_estimado,
          // usuario: {
          //   id: row.user_id,
          //   nombre: row.user_nombre,
          //   email: row.user_email,
          // },
          carros_placas: [],
        };
      }

      citas[row.cita_id].carros_placas.push(row.placa);
    }

    // const citas = await db("citas as ci")
    //   .where("ci.user_id", userId)
    //   .leftJoin("servicios as se", "ci.servicio_id", "se.id")
    //   .leftJoin("usuarios as us", "ci.user_id", "us.id")
    //   .select(
    //     "ci.*",
    //     "se.tipo",
    //     "se.precio",
    //     "se.tiempo_estimado",
    //     "us.telefono"
    //   );
    // .join("carros as ca", "ci.user_id", "ca.user_id")
    // .join("servicios as se", "ci.servicio_id", "se.id")

    return res.status(200).json({
      data: Object.values(citas),
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Error ");
  }
});

// Done FE
routerUsers.put("/actualizar-carro/:placa", async (req, res) => {
  const { placa } = req.params;
  const { color, marca, modelo, user_id, año } = req.body;
  if (!placa) {
    return res.status(400).json({
      data: "No carro placa proveido",
    });
  }
  try {
    const payload = { placa, color, marca, modelo, user_id, año };
    await db("carros").where({ placa }).update(payload);
    res.status(200).json("Carro actualizado!");
  } catch (error) {
    return res.status(500).json({
      data: "No pudo ser actualizado!",
    });
  }
});

// Done FE
routerUsers.delete("/eliminar-carro/:placa", async (req, res) => {
  const { placa } = req.params;
  if (!placa) {
    return res.status(400).json({
      data: "No carro id proveido",
    });
  }

  try {
    const citasIds = await db("carro_cita").where({ placa }).select("cita_id");

    for (let citaId of citasIds) {
      const { cita_id } = citaId || {};

      await db("carro_cita").delete().where({ cita_id }); // eliminado los carros asociados a las citas
      await db("equipo_vehiculo_cita").delete().where({ cita_id }); // eliminado los equipos utilizados
      await db("citas").delete().where({ cita_id }); // eliminado las citas
    }

    await db("carros").delete().where({ placa });
    res.status(200).json("Carro Eliminado!");
  } catch (error) {
    return res.status(500).json({
      data: "No pudo ser eliminado!",
    });
  }
});

routerUsers.post("/verificar-placas-disponible", async (req, res) => {
  const { placas, fecha } = req.body;

  try {
    const { placasOcupadas } = await obtenerCarrosAgendados(fecha, placas);

    let unoEstaAgendado = [];

    for (let placa of placasOcupadas) {
      if (placas.includes(placa)) {
        unoEstaAgendado.push(true);
      }
    }

    return res.status(200).json({
      placasOcupadas,
      unoEstaAgendado: unoEstaAgendado?.some((uno) => uno === true) || false,
    });
  } catch (error) {
    console.log(error);
  }
});
