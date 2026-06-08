import {
    minutes,
    seconds,
    ThrottlerModuleOptions
} from '@nestjs/throttler';

export const throttlerConfig: ThrottlerModuleOptions = {
  throttlers: [
    {
      ttl: seconds(60),
      limit: 50,
      blockDuration: minutes(10),
    },
  ],
};
