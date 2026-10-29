type Operation = { tags?: string[]; responses?: Record<string, unknown> }
type Tag = { name: string; description?: string }

const methods = ['get', 'put', 'post', 'delete', 'patch', 'options', 'head', 'trace']
const contractSuffix = ' (contract)'

// An operation that still declares a 501 has no handler yet: it only exists in the contract.
const isContractOnly = (op: Operation) => op.responses !== undefined && '501' in op.responses

// Splits the docs in two groups so implemented routes are not lost among the contract-only ones:
// tags of routes with a handler stay as they are, tags of routes still answering 501 get a
// " (contract)" suffix. Implementing a route is enough to move it: drop its 501 response.
export function groupByImplementation(paths: Record<string, object>, tags: Tag[]) {
  const implemented = new Set<string>()
  const contractOnly = new Set<string>()

  const groupedPaths = Object.fromEntries(
    Object.entries(paths).map(([path, item]) => [
      path,
      Object.fromEntries(
        Object.entries(item as Record<string, unknown>).map(([method, value]) => {
          if (!methods.includes(method)) return [method, value]
          const op = value as Operation
          const contract = isContractOnly(op)
          const opTags = (op.tags ?? []).map((tag) => {
            if (!contract) {
              implemented.add(tag)
              return tag
            }
            contractOnly.add(tag)
            return `${tag}${contractSuffix}`
          })
          return [method, { ...op, tags: opTags }]
        }),
      ),
    ]),
  )

  const groupedTags = tags.flatMap((tag) => [
    ...(implemented.has(tag.name) ? [tag] : []),
    ...(contractOnly.has(tag.name)
      ? [
          {
            ...tag,
            name: `${tag.name}${contractSuffix}`,
            description: tag.description ?? undefined,
          },
        ]
      : []),
  ])

  return {
    paths: groupedPaths,
    tags: groupedTags,
    'x-tagGroups': [
      { name: 'Implemented', tags: tags.filter((t) => implemented.has(t.name)).map((t) => t.name) },
      {
        name: 'Contract only (not implemented)',
        tags: tags.filter((t) => contractOnly.has(t.name)).map((t) => `${t.name}${contractSuffix}`),
      },
    ],
  }
}
