import knex from "knex";
export const knexDB = knex()({
  client: "mysql",
  connection: {
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    password: "chocolate",
    database: "carWash",
  },
});
