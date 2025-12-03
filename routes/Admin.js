import express from "express";
import { DataBase } from "../db/index.js";
import { verifyToken } from "../utils/verificarToken.js";

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

    // const clientesFormateado = clientes.map((cliente) => {
    //   delete cliente.contrasena;
    //   return cliente;
    // });

    res.status(200).json({
      data: clientes,
    });
  } catch (error) {
    console.log(error);
  }
});
routerAdmin.get("/ordenes", verifyToken, async (req, res) => {
  try {
    const citas = await db("citas as ci")
      .leftJoin("servicios as se", "ci.servicio_id", "se.id")
      .leftJoin("usuarios as us", "ci.user_id", "us.id")
      .select(
        "ci.*",
        "se.tipo",
        "se.precio",
        "se.tiempo_estimado",
        "us.nombre",
        "us.apellido"
      );

    return res.status(200).json({
      data: citas,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Error ");
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

routerAdmin.delete("/eliminar-cliente/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json("No id ");

  try {
    await db("citas").delete().where({ user_id: id });
    await db("carros").delete().where({ user_id: id });
    await db("usuarios").delete().where({ id });

    res.status(200).json("Cliente eliminado");
  } catch (error) {
    console.log(error);
  }
});

routerAdmin.get("/carros", verifyToken, async (req, res) => {
  try {
    const carros = await db("carros as ca")
      .leftJoin("usuarios as us", "ca.user_id", "us.id")
      .select("ca.*", "us.nombre", "us.apellido");

    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerAdmin.post("/add-car", verifyToken, async (req, res) => {
  const { color, marca, modelo, user_id, año } = req.body;
  try {
    const car = {
      color,
      marca,
      modelo,
      user_id,
      año,
      estado: "activo",
    };

    await db("carros").insert(car);
    res.status(200).json("Added");
  } catch (error) {
    console.log(error);
  }
});

// routerAdmin.delete("/eliminar-carro/:id", verifyToken, async (req, res) => {
//   const { id } = req.params;
//   const { color, marca, modelo, user_id, año } = req.body;
//   if (!id) return res.status(400).json("No id ");

//   try {
//     const payload = { color, marca, modelo, user_id, año, estado: "inactivo" };

//     await db("carros").update(payload).where({ id: id });

//     res.status(200).json("Carro actualizado!");
//   } catch (error) {
//     console.log(error);
//   }
// });

routerAdmin.delete("/eliminar-cita/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  if (!id) return res.status(400).json("No id ");

  try {
    await db("citas").delete().where({ id: id });

    res.status(200).json("Carro eliminado");
  } catch (error) {
    console.log(error);
  }
});

// Cajero rutas

routerAdmin.put("/update-ordenes", verifyToken, async (req, res) => {
  const { id, fecha, estado, user_id, servicio_id, carros_ids } = req.body;

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
