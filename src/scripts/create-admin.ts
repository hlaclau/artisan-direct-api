const email = Bun.env.ADMIN_EMAIL
const name = Bun.env.ADMIN_NAME ?? 'Admin'
const password = Bun.env.ADMIN_PASSWORD

if (!email || !password) {
  throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required in .env')
}

const proc = Bun.spawn(
  [
    'bun',
    'x',
    'auth@latest',
    'create-admin',
    '--email',
    email,
    '--name',
    name,
    '--role',
    'admin',
    '--password',
    password,
  ],
  {
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  },
)

process.exit(await proc.exited)
