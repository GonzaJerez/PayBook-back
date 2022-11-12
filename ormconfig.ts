import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

export const AppDataSource = new DataSource({
  ssl: process.env.NODE_ENV === 'prod',
  extra: {
    ssl: process.env.NODE_ENV === 'prod' ? { rejectUnauthorized: false } : null,
  },
  type: 'postgres',
  host: process.env.PROD === 'true' ? process.env.DB_HOST : 'localhost',
  port: +process.env.DB_PORT,
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  synchronize: process.env.NODE_ENV !== 'prod',
  entities: ['dist/**/*.entity{ .ts,.js}'],
  migrations: ['dist/**/migrations/*{.ts,.js}'],
  migrationsRun: process.env.NODE_ENV !== 'prod',
});
