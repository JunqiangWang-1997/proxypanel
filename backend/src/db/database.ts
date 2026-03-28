import path from 'node:path';
import fs from 'node:fs/promises';
import sqlite3 from 'sqlite3';
import { open, type Database } from 'sqlite';
import { env } from '../config/env.js';

let database: Database<sqlite3.Database, sqlite3.Statement> | null = null;

export const getDatabase = async (): Promise<Database<sqlite3.Database, sqlite3.Statement>> => {
  if (database) {
    return database;
  }

  await fs.mkdir(path.dirname(env.databasePath), { recursive: true });

  database = await open({
    filename: env.databasePath,
    driver: sqlite3.Database
  });

  await database.exec('PRAGMA foreign_keys = ON;');

  return database;
};

