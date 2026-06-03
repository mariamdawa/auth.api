import { Inject, Injectable } from '@nestjs/common';
import Config from './config';
import type { ConfigType } from '@nestjs/config';

@Injectable()
export class AppConfig {
	constructor(
		@Inject(Config.KEY)
		public config: ConfigType<typeof Config>
	) {}
}
