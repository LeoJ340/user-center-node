import { Sequelize } from 'sequelize'
import { config } from '@/config'
import { logger } from '@/config/logger'

export const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
  host: config.db.host,
  port: config.db.port,
  dialect: 'mysql',
  timezone: '+08:00',
  logging: (sql) => logger.debug({ sql }, 'sql'),
  pool: {
    max: config.db.pool.max,
    min: config.db.pool.min,
    acquire: config.db.pool.acquire,
    idle: config.db.pool.idle,
  },
})

export async function connectDb() {
  await sequelize.authenticate()
}
