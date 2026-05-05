import { Injectable } from '@nestjs/common';

@Injectable()
export class ConflictService {
  async getData(region: string, params: any) {
    // TODO: Implement conflict data using ACLED API
    return [];
  }
}
