/**
 * SSE 客户端 - 用于接收后端的 Server-Sent Events
 */

export interface SSEClientOptions {
  /** API 端点 URL */
  url: string
  /** 请求方法 */
  method?: 'GET' | 'POST'
  /** 请求头 */
  headers?: Record<string, string>
  /** 请求体（POST 时使用） */
  body?: any
  /** 事件回调 */
  onEvent: (event: any) => void
  /** 错误回调 */
  onError?: (error: Error) => void
  /** 连接关闭回调 */
  onClose?: () => void
  /** 心跳回调（检测到流暂停时触发） */
  onHeartbeat?: () => void
}

export class SSEClient {
  private abortController: AbortController | null = null

  /**
   * 连接到 SSE 端点并开始接收事件
   */
  async connect(options: SSEClientOptions): Promise<void> {
    const {
      url,
      method = 'POST',
      headers = {},
      body,
      onEvent,
      onError,
      onClose,
      onHeartbeat,
    } = options

    this.abortController = new AbortController()

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: this.abortController.signal,
      })

      if (!response.ok) {
        throw new Error(`SSE request failed: ${response.status} ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('Response body is null')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          console.log('✅ SSE stream completed')
          onClose?.()
          break
        }

        // 解码并追加到 buffer
        buffer += decoder.decode(value, { stream: true })

        // 按行分割
        const lines = buffer.split('\n')
        // 保留最后不完整的行
        buffer = lines.pop() || ''

        for (const line of lines) {
          // 处理心跳信号（后端暂停流时发送）
          if (line.trim() === ': heartbeat') {
            console.log('💓 收到心跳信号 - 流已暂停')
            onHeartbeat?.()
            continue
          }
          
          // SSE 格式: "data: {...}\n\n"
          if (line.startsWith('data: ')) {
            const data = line.slice(6).trim()
            if (data) {
              try {
                const event = JSON.parse(data)
                onEvent(event)
              } catch (error) {
                console.error('Failed to parse SSE event:', data, error)
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('SSE connection aborted')
        } else {
          console.error('SSE connection error:', error)
          onError?.(error)
        }
      }
    }
  }

  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }
}
