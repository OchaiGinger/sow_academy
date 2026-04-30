require('dotenv').config();
const { Client } = require('pg');

const client = new Client({ connectionString: process.env.DATABASE_URL });

client.connect()
  .then(() => client.query(`SELECT password FROM "Account" WHERE "accountId" = 'admin@school.edu.ng'`))
  .then(r => { console.log(r.rows[0]); client.end(); })
  .catch(e => { console.error(e); client.end(); });