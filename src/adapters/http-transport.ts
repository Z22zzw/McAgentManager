export interface HttpRequest {
  method: 'GET' | 'POST' | 'DELETE'
  path: string
  body?: unknown
  headers?: Record<string, string>
}

export interface HttpResponse { status: number; body: unknown; headers?: Record<string, string> }
export interface HttpTransport { request(request: HttpRequest): Promise<HttpResponse> }
export interface FetchTransportOptions { token?: string; headers?: Record<string, string>; fetcher?: typeof fetch }

export class FetchHttpTransport implements HttpTransport {
  private readonly fetcher: typeof fetch
  constructor(private readonly baseUrl: string, private readonly options: FetchTransportOptions = {}) { this.fetcher = options.fetcher ?? fetch }

  async request(request: HttpRequest): Promise<HttpResponse> {
    const url = new URL(request.path, this.baseUrl)
    if (this.options.token) url.searchParams.set('token', this.options.token)
    const response = await this.fetcher(url, {
      method: request.method,
      headers: { accept: 'application/json', 'x-requested-with': 'XMLHttpRequest', ...(this.options.headers ?? {}), ...(request.body === undefined ? {} : { 'content-type': 'application/json' }), ...request.headers },
      ...(request.body === undefined ? {} : { body: JSON.stringify(request.body) }),
    })
    const text = await response.text()
    let body: unknown = null
    if (text.length > 0) { try { body = JSON.parse(text) } catch { body = text } }
    return { status: response.status, body, headers: Object.fromEntries(response.headers.entries()) }
  }
}
