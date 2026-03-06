import { useState, useCallback, useRef } from 'react';
import { StreamRequest, type StreamEvent } from '@/utils/streamRequest';

/**
 * 输出日志项
 */
export interface OutputLog {
  id: string;
  timestamp: number;
  type: 'event' | 'text' | 'error' | 'info';
  content: string;
  eventType?: string;
}

/**
 * 开发者面板的 ViewModel
 */
export function useDevPanelViewModel() {
  const [logs, setLogs] = useState<OutputLog[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  
  const streamRequestRef = useRef<StreamRequest | null>(null);
  const textBufferRef = useRef<string>('');

  /**
   * 添加日志
   */
  const addLog = useCallback((log: Omit<OutputLog, 'id' | 'timestamp'>) => {
    const newLog: OutputLog = {
      ...log,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setLogs((prev) => [...prev, newLog]);
  }, []);

  /**
   * 清空日志
   */
  const clearLogs = useCallback(() => {
    setLogs([]);
    textBufferRef.current = '';
    setProgress(0);
    setSessionId(null);
    setTotalEvents(0);
  }, []);

  /**
   * 处理流式事件
   */
  const handleStreamEvent = useCallback((event: StreamEvent) => {
    // 处理文本内容流
    if (event.type === 'text_message_content' && event.delta) {
      textBufferRef.current += event.delta;
      // 添加或更新文本日志
      setLogs((prev) => {
        const lastLog = prev[prev.length - 1];
        if (lastLog && lastLog.type === 'text') {
          // 更新最后一条文本日志
          return [
            ...prev.slice(0, -1),
            { ...lastLog, content: textBufferRef.current },
          ];
        } else {
          // 创建新的文本日志
          return [
            ...prev,
            {
              id: `${Date.now()}-${Math.random()}`,
              timestamp: Date.now(),
              type: 'text',
              content: textBufferRef.current,
              eventType: event.type,
            },
          ];
        }
      });
    } else {
      // 其他事件类型
      const content = formatEventContent(event);
      addLog({
        type: 'event',
        content,
        eventType: event.type,
      });
    }

    // 更新进度
    if (event._meta && typeof event._meta === 'object') {
      const meta = event._meta as { index?: number; total?: number };
      if (typeof meta.index === 'number' && typeof meta.total === 'number') {
        const prog = Math.round((meta.index / meta.total) * 100);
        setProgress(prog);
      }
    }
  }, [addLog]);

  /**
   * 开始流式测试
   */
  const startStreamTest = useCallback(() => {
    if (isStreaming) {
      return;
    }

    clearLogs();
    textBufferRef.current = '';
    setIsStreaming(true);

    addLog({
      type: 'info',
      content: '🚀 开始流式请求测试...',
    });

    const streamRequest = new StreamRequest({
      url: '/api/uws-stream',
      mode: 'default',
      speed: 'fast',
      onSessionStart: (data) => {
        setSessionId(data.sessionId);
        setTotalEvents(data.totalEvents);
        addLog({
          type: 'info',
          content: `✅ 会话开始 | SessionID: ${data.sessionId} | 总事件数: ${data.totalEvents}`,
        });
      },
      onEvent: handleStreamEvent,
      onComplete: () => {
        setIsStreaming(false);
        setProgress(100);
        addLog({
          type: 'info',
          content: '✅ 流式传输完成',
        });
      },
      onError: (error) => {
        setIsStreaming(false);
        const errorMessage = error instanceof Error ? error.message : '流式请求失败';
        addLog({
          type: 'error',
          content: `❌ 错误: ${errorMessage}`,
        });
      },
    });

    streamRequestRef.current = streamRequest;
    streamRequest.start();
  }, [isStreaming, clearLogs, addLog, handleStreamEvent]);

  /**
   * 停止流式测试
   */
  const stopStreamTest = useCallback(() => {
    if (streamRequestRef.current) {
      streamRequestRef.current.stop();
      streamRequestRef.current = null;
    }
    setIsStreaming(false);
    addLog({
      type: 'info',
      content: '⏸️ 流式传输已停止',
    });
  }, [addLog]);

  return {
    logs,
    isStreaming,
    sessionId,
    progress,
    totalEvents,
    startStreamTest,
    stopStreamTest,
    clearLogs,
  };
}

/**
 * 格式化事件内容用于显示
 */
function formatEventContent(event: StreamEvent): string {
  const { type, ...rest } = event;
  
  switch (type) {
    case 'run_started':
      return `▶️ 工作流开始`;
    case 'run_finished':
      return `⏹️ 工作流结束`;
    case 'text_message_start':
      return `📝 消息开始 | ID: ${event.messageId}`;
    case 'text_message_end':
      return `📝 消息结束`;
    case 'tool_call_start':
      return `🔧 工具调用开始 | ${event.toolCallName}`;
    case 'tool_call_end':
      return `🔧 工具调用结束`;
    case 'tool_call_result':
      return `🔧 工具结果 | ${JSON.stringify(event.result || {})}`;
    case 'step_started':
      return `🔄 步骤开始 | ${event.stepName || ''}`;
    case 'step_finished':
      return `🔄 步骤完成`;
    default:
      return `📋 ${type} | ${JSON.stringify(rest)}`;
  }
}
