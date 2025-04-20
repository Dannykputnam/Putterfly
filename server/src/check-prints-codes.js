import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

async function checkCodes() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
  const prints = await db.all('SELECT id, name, code FROM prints');
  console.log('Prints with codes:');
  for (const print of prints) {
    console.log(`ID: ${print.id}, Name: ${print.name}, Code: ${print.code}`);
  }
  await db.close();
}

checkCodes();
