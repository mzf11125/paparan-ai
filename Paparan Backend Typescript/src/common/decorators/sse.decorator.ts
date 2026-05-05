import { SetMetadata } from '@nestjs/common';

export const IS_SSE_ENDPOINT = 'isSseEndpoint';

/**
 * Mark a controller method as an SSE (Server-Sent Events) endpoint
 */
export const Sse = () => SetMetadata(IS_SSE_ENDPOINT, true);
