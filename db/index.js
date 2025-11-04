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

    try {
      this.knex = knexDB();
      await this.knex.raw("select ");
      this.initialized = true;
      return this.knex;
    } catch (error) {
      console.log(error);
    }
  }

  getDB() {
    if (!this.initialized) {
      this.knex = knexDB();
    }

    return this.knex;
  }
}
