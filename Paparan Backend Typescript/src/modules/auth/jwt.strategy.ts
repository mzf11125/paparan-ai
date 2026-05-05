import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService, JwtPayload } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-secret-key',
      passReqToCallback: true,
    });
  }

  async validate(request: any, payload: JwtPayload) {
    // Additional validation can be done here
    // For now, we'll just verify the user exists
    try {
      const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
      const user = await this.authService.validateToken(token);
      return {
        id: payload.sub,
        email: payload.email,
        ...user,
      };
    } catch (error) {
      throw new UnauthorizedException('Token validation failed');
    }
  }
}
