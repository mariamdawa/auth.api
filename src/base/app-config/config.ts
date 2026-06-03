import { registerAs } from '@nestjs/config';
import { StringValue } from 'ms';

export interface Config {
	env: string;
	server: {
		host: string;
		port: string;
	};
	dataBase: {
		host: string;
		port: string;
		dbName: string;
		userName: string;
		password: string;
	};
	jwt: {
		accessTokenSecret: string;
		accessTokenExpiration: StringValue;
		refreshTokenSecret: string;
		refreshTokenExpiration: StringValue;
	};
}

export default registerAs<Config>('config', () => ({
	env: process.env.APP_ENV!,
	server: {
		host: process.env.SERVER_HOST!,
		port: process.env.SERVER_PORT!
	},
	dataBase: {
		host: process.env.DATABASE_HOST!,
		port: process.env.DATABASE_PORT!,
		dbName: process.env.DATABASE_NAME!,
		userName: process.env.DATABASE_USERNAME!,
		password: process.env.DATABASE_PASSWORD!
	},
	jwt: {
		accessTokenSecret: process.env.JWT_ACCESS_SECRET!,
		accessTokenExpiration: (process.env.JWT_ACCESS_EXPIRATION ?? '15m') as StringValue,
		refreshTokenSecret: process.env.JWT_REFRESH_SECRET!,
		refreshTokenExpiration: (process.env.JWT_REFRESH_EXPIRATION ?? '7d') as StringValue
	}
}));
