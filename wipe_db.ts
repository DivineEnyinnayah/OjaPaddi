import { createDb } from '@ojapaddi/db';
const db = createDb();
async function wipe() {
  console.log('Wiping database...');
  // Note: Using raw SQL or Drizzle's delete. Since I don't have a full environment,
  // I'll use the Drizzle client's delete method.
  await db.delete(db.schema.session);
  await db.delete(db.schema.account);
  await db.delete(db.schema.verification);
  await db.delete(db.schema.businesses);
  await db.delete(db.schema.user);
  console.log('Database wiped clean.');
}
wipe().catch(console.error);
