import { sql } from 'drizzle-orm';
import { db } from './server/db';

async function main() {
  console.log('Inizializzazione database in corso...');

  // Drop tabelle se esistono
  await db.execute(sql`DROP TABLE IF EXISTS assignments CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS employees CASCADE`);
  await db.execute(sql`DROP TABLE IF EXISTS apartments CASCADE`);

  // Crea tabella apartments
  console.log('Creazione tabella apartments...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS apartments (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      cleaning_date VARCHAR(10) NOT NULL,
      start_time VARCHAR(5),
      end_time VARCHAR(5),
      status VARCHAR(20) NOT NULL DEFAULT 'Da Fare',
      payment_status VARCHAR(20) NOT NULL DEFAULT 'Da Pagare',
      notes TEXT,
      price NUMERIC(10, 2)
    )
  `);

  // Crea tabella employees
  console.log('Creazione tabella employees...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS employees (
      id SERIAL PRIMARY KEY,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL
    )
  `);

  // Crea tabella assignments
  console.log('Creazione tabella assignments...');
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS assignments (
      id SERIAL PRIMARY KEY,
      apartment_id INTEGER NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      UNIQUE(apartment_id, employee_id)
    )
  `);

  console.log('Database inizializzato con successo!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Errore durante l\'inizializzazione del database:', error);
  process.exit(1);
});
