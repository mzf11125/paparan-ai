import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserInfo {
  id: string;
  email: string;
  metadata?: Record<string, any>;
}

export const CurrentUser = createParamDecorator(
  (data: keyof UserInfo | undefined, ctx: ExecutionContext): UserInfo | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserInfo;

    if (data) {
      return user?.[data];
    }

    return user;
  },
);
