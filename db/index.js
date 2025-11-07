import { knexDB } from './knex.js'
export class DataBase {
  constructor() {
    this.knex = null;
    this.initialized = null;
  }

  async connectDB() {
    if (this.knex) {
      return this.knex;
    }

    this.knex = knexDB;

    try {
      await this.knex.raw("select 1+1 as result");
      console.log("DB connected")
      this.initialized = true;
    } catch (error) {
      console.log(error);
    }
  }

  getDB() {
    if (!this.initialized) {
      this.knex = knexDB;
    }

    return this.knex;
  }
}
