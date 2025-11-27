import express from "express";
import { DataBase } from "../db/index.js";
import { verifyToken } from "../utils/verificarToken.js";

export const routerAdmin = express.Router();
const db = new DataBase().getDB();

routerAdmin.get("/clientes", verifyToken, async (req, res) => {
  try {
    const clientes = await db("clientes").where({ rol: "cliente" }).select("*");

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

routerAdmin.get("/cars", verifyToken, async (req, res) => {
  try {
    const carros = await db("carros").select("*");
    return res.status(200).json({
      data: carros,
    });
  } catch (error) {}
});
