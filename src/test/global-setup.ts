import { execFileSync } from 'node:child_process'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

// Testcontainers ignores Docker contexts (Colima, OrbStack, Docker Desktop...), so point it at the active one.
function useActiveDockerContext() {
  if (process.env.DOCKER_HOST) return

  let host = ''
  try {
    host = execFileSync('docker', ['context', 'inspect', '--format', '{{.Endpoints.docker.Host}}'])
      .toString()
      .trim()
  } catch {
    return // no docker CLI: let Testcontainers report the problem
  }
  if (!host.startsWith('unix://')) return

  process.env.DOCKER_HOST = host
  // The socket path inside the Docker VM, used when the Ryuk reaper container mounts it.
  process.env.TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE ??= '/var/run/docker.sock'
}

// Throwaway PostGIS container, so tests never touch the dev database.
export default async function setup() {
  useActiveDockerContext()

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
