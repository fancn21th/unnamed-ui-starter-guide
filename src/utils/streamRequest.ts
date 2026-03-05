/**
 * 流式请求事件类型
 */
export interface StreamEvent {
  type: string;
  [key: string]: unknown;
}

/**
 * 流式请求配置选项
 */
export interface StreamRequestOptions {
  /** 请求 URL */
  url: string;
  /** 模式：默认或人工介入 */
  mode?: 'default' | 'human-in-loop';
  /** 速度：慢/正常/快 */
  speed?: 'slow' | 'normal' | 'fast';
  /** 事件回调 */
  onEvent?: (event: StreamEvent) => void;
  /** 会话开始回调 */
  onSessionStart?: (data: { sessionId: string; totalEvents: number }) => void;
  /** 完成回调 */
  onComplete?: (data?: unknown) => void;
  /** 错误回调 */
  onError?: (error: unknown) => void;
}

/**
 * 流式请求管理器
 */
export class StreamRequest {
  private eventSource: EventSource | null = null;
  private sessionId: string | null = null;
  private options: StreamRequestOptions;

  constructor(options: StreamRequestOptions) {
    this.options = options;
  }

  /**
   * 开始流式请求
   */
  start(): void {
    if (this.eventSource) {
      this.stop();
    }

    const { url, mode = 'default', speed = 'normal' } = this.options;
    const queryParams = new URLSearchParams();
    
    if (mode !== 'default') {
      queryParams.append('mode', mode);
    }
    if (speed !== 'normal') {
      queryParams.append('speed', speed);
    }

    const fullUrl = queryParams.toString() 
      ? `${url}?${queryParams.toString()}` 
      : url;

    this.eventSource = new EventSource(fullUrl);

    // 监听会话开始
    this.eventSource.addEventListener('session_start', (e) => {
      const data = JSON.parse(e.data);
      this.sessionId = data.sessionId;
      this.options.onSessionStart?.(data);
    });

    // 监听所有可能的事件类型
    const eventTypes = [
      'run_started',
      'run_finished',
      'text_message_start',
      'text_message_content',
      'text_message_end',
      'tool_call_start',
      'tool_call_args',
      'tool_call_end',
      'tool_call_result',
      'step_started',
      'step_finished',
      'human_intervention_required',
    ];

    eventTypes.forEach((eventType) => {
      this.eventSource!.addEventListener(eventType, (e) => {
        try {
          const event = JSON.parse(e.data);
          this.options.onEvent?.({ ...event, type: eventType });
        } catch (error) {
          console.error(`解析事件 ${eventType} 失败:`, error);
        }
      });
    });

    // 监听完成事件
    this.eventSource.addEventListener('complete', (e) => {
      try {
        const data = JSON.parse(e.data);
        this.options.onComplete?.(data);
      } catch {
        this.options.onComplete?.();
      }
      this.stop();
    });

    // 错误处理
    this.eventSource.onerror = (error) => {
      console.error('流式请求错误:', error);
      this.options.onError?.(error);
      this.stop();
    };
  }

  /**
   * 停止流式请求
   */
  stop(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * 获取当前会话 ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  /**
   * 是否正在流式传输
   */
  isStreaming(): boolean {
    return this.eventSource !== null;
  }
}

/**
 * 快速创建流式请求的辅助函数
 */
export function createStreamRequest(options: StreamRequestOptions): StreamRequest {
  return new StreamRequest(options);
}
