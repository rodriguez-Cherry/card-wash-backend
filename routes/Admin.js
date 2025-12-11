import express from "express";
import { DataBase } from "../db/index.js";
import { verifyToken } from "../utils/verificarToken.js";
import { conserguirCitasConUsuarioyCarros } from "../utils/conseguirCitas.js";

export const routerAdmin = express.Router();
const db = new DataBase().getDB();
// Done FE
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
// Done FE
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
// Done FE
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
// Done FE
routerAdmin.post("/add-car", verifyToken, async (req, res) => {
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
    res.status(200).json("Added");
  } catch (error) {
    console.log(error);
  }
});

// Done FE
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

// Done FE
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

// Done FE
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

routerAdmin.post("/cancelar-cita/:cita_id", async (req, res) => {
  const { cita_id } = req.params || {};
  const { razon } = req.body || {};

  if (!cita_id) {
    return res.status(400).json("No id proveido");
  }

  if (!razon) {
    return res.status(400).json("No razon proveida");
  }

  try {
    const cita = await db("citas")
      .where({ cita_id: cita_id })
      .select("*")
      .first();
    const servicio = await db("servicios")
      .where({ servicio_id: cita.servicio_id })
      .select("*")
      .first();

    const carrosPlacas = await db("carro_cita")
      .where({ cita_id })
      .select("placa");
    const carrosPorCita = [];
    for (let placa of carrosPlacas) {
      const carro = await db("carros").where({ placa: placa.placa }).first();
      carrosPorCita.push(carro);
    }

    const user_id = carrosPorCita[0]?.user_id;
    const usuario = await db("usuarios")
      .where({ id:user_id })
      .select("nombre", "apellido", "telefono")
      .first();

    await db("facturas_historial").insert({
      factura_id: cita_id,
      nombre: usuario?.nombre,
      apellido: usuario?.apellido,
      telefono: usuario?.telefono,
      servicio_nombre: servicio?.tipo,
      precio: servicio?.precio,
      descripcion: razon,
    });

    for (const carro of carrosPorCita) {
      await db("facturas_historial_carros").insert({
        factura_id: cita_id,
        placa: carro.placa,
        marca: carro.marca,
        modelo: carro.modelo,
        año: carro.año,
        color: carro.color,
      });
    }

    await db("carro_cita").delete().where({ cita_id });
    await db("equipo_vehiculo_cita").delete().where({ cita_id });
    await db("citas").delete().where({ cita_id });

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
