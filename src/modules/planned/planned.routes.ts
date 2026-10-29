import { OpenAPIHono } from '@hono/zod-openapi'
import { notImplemented } from '../../lib/problem.ts'
import { stubRoute } from '../../lib/stub-route.ts'

type Row = Parameters<typeof stubRoute>[0]
const row = (
  tag: string,
  method: Row['method'],
  path: string,
  summary: string,
  access?: Row['access'],
): Row => ({ tag, method, path, summary, access })

// Domains not detailed yet: only their place in the API and who can call them.
const rows = [
  row(
    'Search',
    'get',
    '/api/artisans',
    'Search artisans (filters, sort, pagination, geolocation)',
    'public',
  ),
  row('Search', 'get', '/api/artisans/{id}', 'Get an artisan public profile', 'public'),
  row('Diagnostic', 'get', '/api/diagnostic/questions', 'Get the diagnostic questions', 'public'),
  row(
    'Diagnostic',
    'post',
    '/api/diagnostic',
    'Submit diagnostic answers and get the matching trade',
    'public',
  ),
  row('Interventions', 'post', '/api/interventions', 'Create an intervention request'),
  row('Interventions', 'get', '/api/interventions', 'List my intervention requests'),
  row('Interventions', 'get', '/api/interventions/{id}', 'Get an intervention request'),
  row('Interventions', 'patch', '/api/interventions/{id}', 'Update an intervention request'),
  row('Interventions', 'delete', '/api/interventions/{id}', 'Delete an intervention request'),
  row(
    'Interventions',
    'post',
    '/api/interventions/{id}/submissions',
    'Send the request to artisans',
  ),
  row(
    'Interventions',
    'get',
    '/api/interventions/{id}/status',
    'Follow the status of an intervention',
  ),
  row(
    'Interventions',
    'patch',
    '/api/interventions/{id}/status',
    'Update the status of an intervention',
  ),
  row('Quotes', 'post', '/api/quotes', 'Create a quote (artisan)', 'artisan'),
  row('Quotes', 'get', '/api/quotes', 'List my quotes'),
  row('Quotes', 'get', '/api/quotes/{id}', 'Get a quote'),
  row('Quotes', 'patch', '/api/quotes/{id}', 'Update a quote (artisan)', 'artisan'),
  row('Quotes', 'post', '/api/quotes/{id}/accept', 'Accept a quote'),
  row('Quotes', 'post', '/api/quotes/{id}/decline', 'Decline a quote'),
  row('Planning', 'get', '/api/artisans/me/availability', 'Get my availability', 'artisan'),
  row('Planning', 'put', '/api/artisans/me/availability', 'Replace my availability', 'artisan'),
  row('Planning', 'post', '/api/appointments', 'Book an appointment'),
  row('Planning', 'get', '/api/appointments', 'List my appointments'),
  row('Planning', 'get', '/api/appointments/{id}', 'Get an appointment'),
  row('Planning', 'patch', '/api/appointments/{id}', 'Reschedule or cancel an appointment'),
  row('Payments', 'post', '/api/payments', 'Start a payment'),
  row('Payments', 'get', '/api/payments', 'List my payments'),
  row('Payments', 'get', '/api/payments/{id}', 'Get a payment'),
  row('Reviews', 'post', '/api/reviews', 'Leave a review'),
  row('Reviews', 'get', '/api/reviews', 'List reviews (filter by artisan)', 'public'),
  row('Reviews', 'get', '/api/reviews/{id}', 'Get a review', 'public'),
  row('Notifications', 'get', '/api/notifications', 'List my notifications'),
  row('Notifications', 'get', '/api/notifications/preferences', 'Get my notification preferences'),
  row(
    'Notifications',
    'put',
    '/api/notifications/preferences',
    'Replace my notification preferences',
  ),
  row('Notifications', 'patch', '/api/notifications/{id}', 'Mark a notification as read'),
]

export const plannedRoutes = new OpenAPIHono()
for (const r of rows) plannedRoutes.openapi(stubRoute(r), notImplemented)
