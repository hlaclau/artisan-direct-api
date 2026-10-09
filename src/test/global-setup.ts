import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

// Throwaway PostGIS container, so tests never touch the dev database.
export default async function setup() {
  const container = await new PostgreSqlContainer('imresamu/postgis:17-3.5').start()
  const url = container.getConnectionUri()

  const client = postgres(url, { max: 1 })
  await migrate(drizzle(client), { migrationsFolder: 'drizzle' })
  await client.end()

  process.env.DATABASE_URL = url

  return async () => {
    await container.stop()
  }
}
