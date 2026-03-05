import React, { useState } from 'react'
import { TaskList, type TodoItem } from '@/components/wuhan/composed/task-list'

export function TestTaskList() {
  const [tasks, setTasks] = useState<TodoItem[]>([
    { id: '1', content: '任务 1', order: 1 },
    { id: '2', content: '任务 2', order: 2 },
    { id: '3', content: '任务 3', order: 3 },
  ])

  const [status, setStatus] = useState<'pending' | 'confirmed'>('pending')

  console.log('🎯 当前任务列表:', tasks)
  console.log('🎯 当前状态:', status)

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">TaskList 测试页面</h1>
      
      <div className="mb-4">
        <p>状态: {status}</p>
        <p>任务数量: {tasks.length}</p>
      </div>

      <TaskList
        dataSource={tasks}
        title="测试待办清单"
        status={status}
        editable={status === 'pending'}
        onItemsChange={(items) => {
          console.log('✅ onItemsChange 被调用:', items)
          setTasks(items)
        }}
        onConfirmExecute={() => {
          console.log('✅ onConfirmExecute 被调用')
          setStatus('confirmed')
        }}
      />

      <div className="mt-4">
        <button
          onClick={() => setStatus('pending')}
          className="px-4 py-2 bg-blue-500 text-white rounded mr-2"
        >
          重置为 Pending
        </button>
        <button
          onClick={() => {
            console.log('手动添加任务')
            setTasks([...tasks, { id: Date.now().toString(), content: '新任务', order: tasks.length + 1 }])
          }}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          手动添加任务
        </button>
      </div>
    </div>
  )
}
