import knex from "knex";
import db from "../knexfile";

const config = knex(db);

export default config;
