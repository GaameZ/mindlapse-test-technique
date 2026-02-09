import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'
import DevSeeder from '#database/seeders/dev_seeder'

export default class DbSeed extends BaseCommand {
  static commandName = 'db:seed'
  static description = 'Run database seeders'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    this.logger.info('Running database seeders...')

    try {
      const seeder = new DevSeeder()
      await seeder.run()

      this.logger.success('Database seeded successfully!')
    } catch (error) {
      this.logger.error('Failed to seed database')
      this.logger.fatal(error instanceof Error ? error.message : String(error))
      process.exit(1)
    }
  }
}
