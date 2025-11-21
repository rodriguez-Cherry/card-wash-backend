import { Router } from "express";
import { DataBase } from "../db/index.js";
import { verifyToken } from "../utils/verificarToken.js";

const db = new DataBase().getDB();
export const routerUsers = Router();

routerUsers.get("/cars", verifyToken, async (req, res) => {
  try {
    const carros = await db("carros").select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerUsers.get("/car/:id", verifyToken, async (req, res) => {
  const { id } = req.params;

  console.log("id", id);
  try {
    const carros = await db("carros").where({ user_id: id }).select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerUsers.get("/servicios", verifyToken, async (req, res) => {
  try {
    const servicios = await db("servicios").select("*");
    return res.status(200).json({
      data: servicios,
    });
  } catch (error) {}
});

routerUsers.get("/citas/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const citas = await db("citas as ci")
      .join("carros as ca", "ci.user_id", "ca.user_id")
      .join("servicios as se", "ci.servicio_id", "se.id")
      .where("ci.user_id", userId)
      .select("*");

    return res.status(200).json({
      data: citas,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json("Error ");
  }
});

routerUsers.post("/book-service", verifyToken, (req, res) => {});

routerUsers.post("/add-car", verifyToken, async (req, res) => {
  const { color, marca, modelo, user_id, año } = req.body;
  try {
    const car = {
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
