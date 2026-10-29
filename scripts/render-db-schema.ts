import { getTableConfig, PgTable } from 'drizzle-orm/pg-core'
import { render } from 'pele'
import * as schema from '../src/db/schema'

const tables = Object.values(schema)
  .filter((v): v is PgTable => v instanceof PgTable)
  .map((t) => getTableConfig(t))

const lines = ['erDiagram']

for (const t of tables) {
  const fks = new Set(t.foreignKeys.flatMap((fk) => fk.reference().columns.map((c) => c.name)))
  lines.push(`  ${t.name} {`)
  for (const c of t.columns) {
    const keys = [c.primary && 'PK', fks.has(c.name) && 'FK', c.isUnique && 'UK'].filter(Boolean)
    lines.push(
      `    ${c.getSQLType().replace(/\W+/g, '_')} ${c.name}${keys.length ? ` ${keys.join(',')}` : ''}`,
    )
  }
  lines.push('  }')
}

for (const t of tables) {
  for (const fk of t.foreignKeys) {
    lines.push(
      `  ${fk.reference().foreignTable[Symbol.for('drizzle:Name')]} ||--o{ ${t.name} : has`,
    )
  }
}

const { svg } = render(lines.join('\n'))
await Bun.write('docs/database-schema.svg', svg)
console.log('Wrote docs/database-schema.svg')
