import { Router } from "express";
import { DataBase } from "../db/index.js";
import { verifyToken } from "../utils/verificarToken.js";

const db = new DataBase().getDB();
export const routerUsers = Router();

routerUsers.get("/cars", verifyToken, async (req, res) => {
  try {
    const carros = await db("carros").where({ estado: "activo" }).select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerUsers.get("/car/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  console.log("id car", id);
  try {
    const carros = await db("carros")
      .where({ user_id: id })
      .andWhere({ estado: "activo" })
      .select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerUsers.get("/car-por-id/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  console.log("id car", id);
  try {
    const carro = await db("carros")
      .where({ id })
      .andWhere({ estado: "activo" })
      .select("*")
      .first();
    return res.status(200).json({
      data: carro,
    });
  } catch (error) {}
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

routerUsers.get("/citas/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const citas = await db("citas as ci")
      .where("ci.user_id", userId)
      .leftJoin("servicios as se", "ci.servicio_id", "se.id")
      .select("ci.*", "se.tipo", "se.precio", "se.tiempo_estimado");
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

routerUsers.post("/agendar", verifyToken, async (req, res) => {
  const { fecha, user_id, carros_id, servicio_id } = req.body;

  if (!fecha || !user_id || !carros_id?.length || !servicio_id) {
    return res.status(400).json("Payload invalido");
  }
  try {
    await db("citas").insert({
      fecha,
      user_id,
      carros_ids: carros_id,

      servicio_id,
    });
    return res.status(200).json("Cita agendata");
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json("Error al agendar su servicio Intente mas tarde");
  }
});

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

routerUsers.post("/add-car", verifyToken, async (req, res) => {
  const { color, marca, modelo, user_id, año, estado } = req.body;
  try {
    const car = {
      color,
      marca,
      modelo,
      user_id,
      año,
      estado,
    };

    await db("carros").insert(car);
    res.status(200).json("Added");
  } catch (error) {
    console.log(error);
  }
});
routerUsers.put("/update-car/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  // const { color, marca, modelo, user_id, año } = req.body;
  if (!id) {
    return res.status(400).json({
      data: "No carro id proveido",
    });
  }
  try {
    await db("carros").where({ id }).update(req.body);
    res.status(200).json("Carro actualizado!");
  } catch (error) {
    return res.status(500).json({
      data: "No pudo ser actualizado!",
    });
  }
});

// routerUsers.post("/eliminar/:id", verifyToken, async (req, res) => {
//   const { id } = req.params;
//   const { color, marca, modelo, user_id, año } = req.body;
//   if (!id) {
//     return res.status(400).json("No id proveido");
//   }
//   try {
//     const payload = { color, marca, modelo, user_id, año, estado: "inactivo" };

//     await db("carros").update(payload).where({ id: id });
//     res.status(200).json("deleted");
//   } catch (error) {
//     console.log(error);
//   }
// });
