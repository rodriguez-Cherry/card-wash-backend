import express from "express";
import { DataBase } from "../db/index.js";
import { verifyToken } from "../utils/verificarToken.js";
import { conserguirCitasConUsuarioyCarros } from "../utils/conseguirCitas.js";

export const routerAdmin = express.Router();
const db = new DataBase().getDB();

routerAdmin.get("/clientes", verifyToken, async (req, res) => {
  try {
    const clientes = await db("usuarios as us")
      .where({ rol: "cliente" })
      .select("*");

    const clientesFormateado = clientes.map((cliente) => {
      delete cliente.contrasena;
      return cliente;
    });

    res.status(200).json({
      data: clientesFormateado,
    });
  } catch (error) {
    console.log(error);
  }
});
routerAdmin.get("/clientes-no-registrados", verifyToken, async (req, res) => {
  try {
    const clientes = await db("usuarios").where({ logueado: 0 }).select("*");

    res.status(200).json({
      data: clientes,
    });
  } catch (error) {
    console.log(error);
  }
});
routerAdmin.get("/carros", verifyToken, async (req, res) => {
  try {
    const carros = await db("carros as ca")
      .leftJoin("usuarios as us", "ca.user_id", "us.id")
      .select("ca.*", "us.nombre", "us.apellido", "us.telefono");

    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerAdmin.post("/add-car", verifyToken, async (req, res) => {
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

routerAdmin.post("/agregar-cliente", verifyToken, async (req, res) => {
  const { nombre, apellido, telefono, direccion, rol } = req.body;

  try {
    await db("usuarios").insert({
      nombre,
      apellido,
      telefono,
      direccion,
      logueado: 0,
      rol,
    });

    res.status(200).json("Cliente agregado");
  } catch (error) {
    console.log(error);
  }
});

routerAdmin.get("/ordenes", async (req, res) => {
  try {
    const citas = await conserguirCitasConUsuarioyCarros();

    // const citas = await db("citas as ci")
    //   .leftJoin("servicios as se", "ci.servicio_id", "se.id")
    //   // .leftJoin("usuarios as us", "ci.user_id", "us.id")
    //   .select(
    //     "ci.*",
    //     "se.tipo",
    //     "se.precio",
    //     "se.tiempo_estimado"
    //     // "us.nombre",
    //     // "us.apellido",
    //     // "us.telefono"
    //   );

    return res.status(200).json({
      data: citas,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Error ");
  }
});

routerAdmin.delete("/eliminar-cliente/:id", async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json("No id ");

  try {
    // TODO:
    // await db("citas").delete().where({ user_id: id });

    // conseguir placas de los carros del usuario
    const carrosPlacaDelUsuario = await db("carros")
      .where({ user_id: id })
      .select("placa");
    let citasIdDelUsuario = [];

    // conseguir las citas_ids de los carros que tienen citas
    for (const carro of carrosPlacaDelUsuario) {
      const citas_ids = await db("carro_cita")
        .where({ placa: carro.placa })
        .select("cita_id");

      citasIdDelUsuario.push(...citas_ids?.map((id) => id?.cita_id));
    }

    // eliminar referencias de citas en  equipo_vehiculo_cita, carro_cita y citas
    for (const cita of citasIdDelUsuario) {
      await db("equipo_vehiculo_cita").delete().where({ cita_id: cita });
      await db("carro_cita").delete().where({ cita_id: cita });
      await db("citas").delete().where({ cita_id: cita });
    }

    // eiminar carros
    await db("carros").delete().where({ user_id: id });
    await db("usuarios").delete().where({ id });

    res.status(200).json("Carro Eliminado");
  } catch (error) {
    console.log(error);
  }
});

routerAdmin.delete("/eliminar-cita/:id", verifyToken, async (req, res) => {
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

// Cajero rutas
// TODO
routerAdmin.put("/update-ordenes", verifyToken, async (req, res) => {
  const { placa, fecha, estado, user_id, servicio_id, carros_ids } = req.body;

  if (!id || !fecha || !estado || !user_id || !servicio_id || !carros_ids)
    return res.status.json("No payload");

  try {
    const cita = { id, fecha, estado, user_id, servicio_id, carros_ids };
    const citas = await db("citas").update(cita).where({ id });

    return res.status(200).json({
      data: citas,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Error ");
  }
});
