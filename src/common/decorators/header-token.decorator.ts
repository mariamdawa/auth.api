import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const HeaderToken = createParamDecorator((data: unknown, ctx: ExecutionContext): string | undefined => {
	const request = ctx.switchToHttp().getRequest();
	const authHeader = request.headers['authorization'];
	if (authHeader && authHeader.startsWith('Bearer')) {
		return authHeader.replace('Bearer', '').trim();
	}
});
