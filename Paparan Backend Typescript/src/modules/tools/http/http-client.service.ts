import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { LRUCache } from 'lru-cache';

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

export interface HttpResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  cached?: boolean;
}

/**
 * HTTP Client service with retry, caching, and error handling
 */
@Injectable()
export class HttpClientService implements OnModuleDestroy {
  private readonly logger = new Logger(HttpClientService.name);
  private client: AxiosInstance;
  private cache: LRUCache<string, { response: any; timestamp: number }>;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Paparan-AI/1.0',
      },
    });

    // Response cache (5 min TTL, max 500 entries)
    this.cache = new LRUCache<string, any>({
      max: 500,
      ttl: 300000,
    });
  }

  onModuleDestroy() {
    this.cache.clear();
  }

  /**
   * Make a GET request
   */
  async get<T = any>(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  /**
   * Make a POST request
   */
  async post<T = any>(
    url: string,
    data?: any,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'POST', data });
  }

  /**
   * Make a PUT request
   */
  async put<T = any>(
    url: string,
    data?: any,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PUT', data });
  }

  /**
   * Make a PATCH request
   */
  async patch<T = any>(
    url: string,
    data?: any,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'PATCH', data });
  }

  /**
   * Make a DELETE request
   */
  async delete<T = any>(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }

  /**
   * Make an HTTP request with retry and caching
   */
  async request<T = any>(
    url: string,
    options: HttpRequestOptions = {},
  ): Promise<HttpResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      timeout = 30000,
      retries = 3,
      cache: useCache = false,
      cacheTTL,
    } = options;

    const cacheKey = this.getCacheKey(method, url, options.data);

    // Check cache for GET requests
    if (method === 'GET' && useCache) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for ${method} ${url}`);
        return {
          ...cached.response,
          cached: true,
        };
      }
    }

    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const config: AxiosRequestConfig = {
          method,
          url,
          headers,
          timeout,
          data: options.data,
          params: options.params,
        };

        this.logger.debug(`HTTP ${method} ${url} (attempt ${attempt + 1}/${retries + 1})`);

        const response: AxiosResponse<T> = await this.client.request(config);

        const result: HttpResponse<T> = {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers as Record<string, string>,
        };

        // Cache successful GET requests
        if (method === 'GET' && useCache && response.status === 200) {
          this.cache.set(cacheKey, result, { ttl: cacheTTL });
        }

        return result;
      } catch (error) {
        lastError = error as Error;

        if (!this.isRetryable(error as AxiosError) || attempt === retries) {
          break;
        }

        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        this.logger.warn(`Request failed, retrying in ${delay}ms: ${error.message}`);
        await this.sleep(delay);
      }
    }

    throw new Error(`HTTP request failed after ${retries + 1} attempts: ${lastError?.message}`);
  }

  /**
   * Fetch and parse JSON
   */
  async fetchJson<T = any>(
    url: string,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const response = await this.get<T>(url, { ...options, cache: true });
    return response.data;
  }

  /**
   * Fetch text content
   */
  async fetchText(
    url: string,
    options?: HttpRequestOptions,
  ): Promise<string> {
    const response = await this.get<string>(url, {
      ...options,
      headers: {
        'Accept': 'text/plain',
        ...options?.headers,
      },
    });
    return response.data;
  }

  /**
   * Download file as buffer
   */
  async downloadFile(
    url: string,
    options?: HttpRequestOptions,
  ): Promise<Buffer> {
    const response = await this.get<ArrayBuffer>(url, {
      ...options,
      responseType: 'arraybuffer',
      cache: false,
    });
    return Buffer.from(response.data);
  }

  /**
   * Check if URL is reachable
   */
  async checkReachable(url: string, timeout = 5000): Promise<boolean> {
    try {
      await this.head(url, { timeout, retries: 0 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Make a HEAD request
   */
  async head(
    url: string,
    options?: HttpRequestOptions,
  ): Promise<HttpResponse> {
    return this.request(url, { ...options, method: 'HEAD' });
  }

  /**
   * Fetch multiple URLs concurrently
   */
  async fetchMultiple<T = any>(
    urls: string[],
    options?: HttpRequestOptions,
  ): Promise<Array<{ url: string; data?: T; error?: string }>> {
    const results = await Promise.allSettled(
      urls.map(url => this.get<T>(url, options))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return { url: urls[index], data: result.value.data };
      } else {
        return { url: urls[index], error: result.reason?.message || 'Unknown error' };
      }
    });
  }

  /**
   * Batch fetch with concurrency limit
   */
  async batchFetch<T = any>(
    urls: string[],
    options: HttpRequestOptions & { concurrency?: number } = {},
  ): Promise<Array<{ url: string; data?: T; error?: string }>> {
    const { concurrency = 5, ...requestOptions } = options;
    const results: Array<{ url: string; data?: T; error?: string }> = [];

    for (let i = 0; i < urls.length; i += concurrency) {
      const batch = urls.slice(i, i + concurrency);
      const batchResults = await this.fetchMultiple<T>(batch, requestOptions);
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Check if error is retryable
   */
  private isRetryable(error: AxiosError): boolean {
    if (!error.response) {
      // Network errors
      const retryableCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'];
      return retryableCodes.includes(error.code as string);
    }

    const status = error.response.status;
    return status >= 500 || status === 429 || status === 408;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(method: string, url: string, data?: any): string {
    const dataStr = data ? JSON.stringify(data) : '';
    return `${method}:${url}:${dataStr}`;
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      calculatedSize: this.cache.calculatedSize,
    };
  }
}
