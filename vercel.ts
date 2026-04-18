import { routes, type VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  framework: 'nextjs',
  buildCommand: 'npm run build',
  headers: [
    routes.cacheControl('/static/(.*)', {
      public: true,
      maxAge: '1 year',
      immutable: true,
    }),
  ],
}
