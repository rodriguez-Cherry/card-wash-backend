import { DataBase } from "./db/index.js";
import { server } from "./server.js";
import 'dotenv/config'


async function startServer() {

  const db = new DataBase()
  await db.connectDB()
  server.listen(3000, () => {
    console.log("Se empezo el mismo");
  });
}

startServer();
