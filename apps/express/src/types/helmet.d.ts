declare module 'helmet' {
  import type { RequestHandler } from 'express'

  export interface HelmetOptions {
    [key: string]: unknown
  }

  const helmet: (options?: HelmetOptions) => RequestHandler
  export default helmet
}
