import { Router } from "express";
import { DataBase } from "../db/index.js";

const db = new DataBase().getDB();
export const routerUsers = Router();

routerUsers.get("/cars", async (req, res) => {
  try {
    const carros = await db("carros").select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerUsers.get("/car/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const carros = await db("carros").where({ user_id: id }).select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});

routerUsers.get("/servicios", async (req, res) => {
  try {
    const servicios = await db("servicios").select("*");
    return res.status(200).json({
      data: servicios,
    });
  } catch (error) {}
});

routerUsers.post("/book-service", (req, res) => {});

routerUsers.post("/add-car", async (req, res) => {
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
