import { Router } from "express";
import { DataBase } from '../db/index.js'
import { createToken } from "../utils/createToken.js";
import bcrypt from "bcrypt";

export const routerAccess = Router();

const db = new DataBase().getDB();

routerAccess.post("/login", async (req, res) => {
  const { email, contrasena } = req?.body || {};

  if (!email || !contrasena) {
    const propiedadesNulas = getNullValues({ email, contrasena });
    const cuantasNulas = propiedadesNulas.split(",").length;
    return res.status(400).json({
      ok: false,
      error:
        cuantasNulas === 1
          ? `${propiedadesNulas} esta vacio `
          : `${propiedadesNulas} estan vacio `,
    });
  }

  let existeUsuario = null;
  let userData = null;
  try {
    const user = await db("usuarios").select("*").where({ email }).first();
    if (user) {
      existeUsuario = true;
      userData = user;
    }
  } catch (error) {
    console.log(error);
  }

  try {
    if (existeUsuario) {
      const esLaMismaContrasena = bcrypt.compareSync(
        contrasena,
        userData.contrasena
      );

      if (!esLaMismaContrasena) {
       return res.status(400).json({
          data: "El usuario/contrasena no coinciden con el usuario",
        });
      }

      const token = await createToken({
        nombre: userData.nombre,
        email: userData.email,
      });

      delete userData.contrasena;
      delete userData.creado_en;

      return res.status(200).json({
        token,
        data: userData,
      });
    } else {
     return res.status(400).json({
        data: "Este usuario no existe",
      });
    }
  } catch (error) {
   return res.status(500).json({
      data: "Intente mas tarde",
    });
  }
});

routerAccess.post("/signup", async (req, res) => {
  const { nombre, email, contrasena } = req?.body || {};

   if (!nombre || !email || !contrasena) {
    const propiedadesNulas = getNullValues({ nombre, email, contrasena });
    const cuantasNulas = propiedadesNulas.split(",").length;
    return res.status(400).json({
      ok: false,
      error:
        cuantasNulas > 1
          ? `${propiedadesNulas} esta vacia `
          : `${propiedadesNulas} estan vacio `,
    });
  }

  // Verificar si el usuario existe
  let existeUsuario = null;

  try {
    const user = await db("usuarios").select("email").where({ email }).first();
    if (user) {
      existeUsuario = true;
    }
  } catch (error) {
    console.log(error);
  }

  if (existeUsuario) {
    return res.status(400).json({
      data: "Este usuario ya existe. Por favor inicie sesion",
    });
  }

  // Agregar usuario
  try {
    const token = await createToken({ email, nombre });
    const salt = bcrypt.genSaltSync(10);
    const hasPassword = bcrypt.hashSync(contrasena, salt);

    await db("usuarios").insert({
      nombre,
      email,
      contrasena: hasPassword,
      rol: "cliente",
    });
    res.status(201).json({
      data: "hello",
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      error,
    });
  }
});

const getNullValues = (propiedades) => {
  let nullOnes = Object.keys(propiedades).filter(
    (llave) => !propiedades[llave]
  );

  return nullOnes.join(",");
};
