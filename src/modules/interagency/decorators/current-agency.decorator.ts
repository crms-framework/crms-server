import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentAgency = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const agency = request.agency;
    return data ? agency?.[data] : agency;
  },
);
