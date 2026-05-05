import { Injectable } from '@nestjs/common';

@Injectable()
export class EnvironmentalService {
  async getData(region: string, params: any) {
    // TODO: Implement environmental data using FIRMS API
    return [];
  }
}
