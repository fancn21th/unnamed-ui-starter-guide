import { useState } from 'react'
import { FloatButton, Modal, Button, Progress, Space, Typography } from 'antd'
import { SettingOutlined, PlayCircleOutlined, StopOutlined, ClearOutlined } from '@ant-design/icons'
import { useDevPanelViewModel } from './view-model'

const { Text } = Typography

export function DevPanel() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const {
    logs,
    isStreaming,
    sessionId,
    progress,
    totalEvents,
    startStreamTest,
    stopStreamTest,
    clearLogs,
  } = useDevPanelViewModel()

  const handleOpenModal = () => {
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
  }

  return (
    <>
      <FloatButton
        icon={<SettingOutlined />}
        type="primary"
        tooltip="开发者面板"
        onClick={handleOpenModal}
      />
      
      <Modal
        title="开发者面板 - 流式请求测试"
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        width={900}
        style={{ top: 40 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '70vh' }}>
          {/* 控制面板 */}
          <div style={{ 
            padding: 16, 
            background: '#f5f5f5', 
            borderRadius: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>
            <Space>
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={startStreamTest}
                disabled={isStreaming}
              >
                开始测试
              </Button>
              <Button
                danger
                icon={<StopOutlined />}
                onClick={stopStreamTest}
                disabled={!isStreaming}
              >
                停止
              </Button>
              <Button
                icon={<ClearOutlined />}
                onClick={clearLogs}
                disabled={isStreaming}
              >
                清空日志
              </Button>
            </Space>

            {/* 状态信息 */}
            {sessionId && (
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Session ID: {sessionId} | 总事件数: {totalEvents} | 进度: {progress}%
                </Text>
                {isStreaming && (
                  <Progress 
                    percent={progress} 
                    size="small" 
                    status="active"
                    style={{ marginTop: 8 }}
                  />
                )}
              </div>
            )}
          </div>

          {/* 输出面板 */}
          <div style={{
            flex: 1,
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            overflow: 'auto',
            background: '#ffffff',
            padding: 16,
            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
            fontSize: 13,
            lineHeight: 1.6,
          }}>
            {logs.length === 0 ? (
              <Text type="secondary">等待开始测试...</Text>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    marginBottom: 8,
                    padding: '6px 10px',
                    borderRadius: 4,
                    background: getLogBackground(log.type),
                    borderLeft: `3px solid ${getLogBorderColor(log.type)}`,
                  }}
                >
                  <Text
                    style={{
                      color: getLogTextColor(log.type),
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}
                  >
                    {log.content}
                  </Text>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}

// 获取日志背景色
function getLogBackground(type: string): string {
  switch (type) {
    case 'error':
      return '#fff2f0'
    case 'info':
      return '#e6f4ff'
    case 'text':
      return '#f6ffed'
    case 'event':
      return '#fafafa'
    default:
      return '#ffffff'
  }
}

// 获取日志边框颜色
function getLogBorderColor(type: string): string {
  switch (type) {
    case 'error':
      return '#ff4d4f'
    case 'info':
      return '#1677ff'
    case 'text':
      return '#52c41a'
    case 'event':
      return '#8c8c8c'
    default:
      return '#d9d9d9'
  }
}

// 获取日志文字颜色
function getLogTextColor(type: string): string {
  switch (type) {
    case 'error':
      return '#cf1322'
    case 'info':
      return '#0958d9'
    case 'text':
      return '#389e0d'
    case 'event':
      return '#595959'
    default:
      return '#000000'
  }
}
