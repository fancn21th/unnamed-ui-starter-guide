# 暂停/恢复功能测试指南

## 测试环境

✅ **后端服务器**: http://localhost:3001 (进程 94374)
✅ **前端服务器**: http://localhost:5173 (进程 96690, 96712)

## 测试场景

### 场景 1: TaskList 暂停和恢复

#### 测试步骤

1. 打开浏览器访问 http://localhost:5173
2. 在输入框中发送消息：**"帮我生成 CSR 报告"**
3. 观察以下行为：

**预期结果 - 第一次暂停（STATE_SNAPSHOT）：**
- [ ] 前端开始接收 SSE 事件
- [ ] 显示思考过程（ThinkingStep）
- [ ] 显示任务列表（TaskList）
- [ ] **流式输出暂停**（不再接收新事件）
- [ ] TaskList 显示为可编辑状态（`editable={true}`，`status="pending"`）
- [ ] 控制台输出：`💓 收到心跳信号 - 流已暂停`

**用户交互：**
4. 编辑任务列表中的任务项（例如：修改任务标题、状态）
5. 点击 **"确认执行"** 按钮

**预期结果 - 恢复流：**
- [ ] 控制台输出：`确认执行 - 调用恢复接口`
- [ ] TaskList 状态变为 `confirmed`（不可编辑）
- [ ] 后端收到恢复请求，继续发送 SSE 事件
- [ ] 前端继续接收并渲染后续事件

---

### 场景 2: DynamicForm 暂停和恢复

**预期结果 - 第二次暂停（CUSTOM: dynamic_form）：**
- [ ] 流式输出再次暂停
- [ ] 显示动态表单（DynamicForm）
- [ ] 表单显示为可填写状态（`status="pending"`，`showActions={true}`）
- [ ] 控制台输出：`💓 收到心跳信号 - 流已暂停`

**用户交互：**
6. 填写表单字段（例如：输入公司名称、报告日期等）
7. 点击 **"提交"** 按钮

**预期结果 - 恢复流：**
- [ ] 控制台输出：`📝 表单提交 - 调用恢复接口`
- [ ] DynamicForm 状态变为 `confirmed`（只读）
- [ ] 后端收到恢复请求，继续发送 SSE 事件
- [ ] 前端继续接收并渲染后续事件

---

### 场景 3: ConfirmPanel 暂停和恢复（可选）

**预期结果 - 第三次暂停（CUSTOM: confirm_panel）：**
- [ ] 流式输出再次暂停
- [ ] 显示确认面板（ConfirmPanel）
- [ ] 控制台输出：`💓 收到心跳信号 - 流已暂停`

**用户交互：**
8. 点击确认面板的 **"确认"** 按钮

**预期结果 - 恢复流：**
- [ ] 后端收到恢复请求，继续发送剩余事件
- [ ] 流程完整结束，显示 `RUN_FINISHED` 事件

---

## 调试检查点

### 浏览器控制台（前端日志）

打开浏览器开发者工具 → Console 标签页，观察以下日志：

```
✅ 正常日志示例：

📤 发送消息: "帮我生成 CSR 报告"
🔄 开始流式接收...
📊 收到事件: RUN_STARTED
📊 收到事件: TEXT_MESSAGE_START
📊 收到事件: THINKING_START
📊 收到事件: STATE_SNAPSHOT
💓 收到心跳信号 - 流已暂停
isPaused 变为: true

[用户编辑 TaskList 并点击"确认执行"]

确认执行 - 调用恢复接口
调用恢复 API: {runId: "xxx", tasklistData: [...]}
isPaused 变为: false
📊 收到事件: STEP_STARTED
📊 收到事件: CUSTOM (dynamic_form)
💓 收到心跳信号 - 流已暂停
isPaused 变为: true

[用户填写表单并点击"提交"]

📝 表单提交 - 调用恢复接口
调用恢复 API: {runId: "xxx", formData: {...}}
isPaused 变为: false
📊 收到事件: TEXT_MESSAGE_CONTENT
📊 收到事件: RUN_FINISHED
✅ 流程结束
```

### Network 面板（网络请求）

打开浏览器开发者工具 → Network 标签页：

1. **SSE 连接**:
   - 请求：`POST /agui`
   - 类型：`text/event-stream`
   - 状态：`200 OK`（持续连接）
   - 观察 Response 标签页，应该看到 SSE 事件流

2. **恢复请求**:
   - 请求：`POST /agui/resume`
   - 状态：`200 OK`
   - 请求体示例：
     ```json
     {
       "runId": "run-123456",
       "tasklistData": [...]
     }
     ```

### 后端终端（服务器日志）

在后端服务器的终端中观察以下日志：

```
✅ 正常日志示例：

🔄 开始生成 SSE 事件流
📤 发送事件: RUN_STARTED
📤 发送事件: TEXT_MESSAGE_START
📤 发送事件: THINKING_START
📤 发送事件: STATE_SNAPSHOT
⏸️  流已暂停 - runId: run-123456
💓 发送心跳信号 (runId: run-123456)
💓 发送心跳信号 (runId: run-123456)

[收到恢复请求]

▶️  恢复流 - runId: run-123456
📤 发送事件: STEP_STARTED
📤 发送事件: CUSTOM (dynamic_form)
⏸️  流再次暂停 - runId: run-123456
💓 发送心跳信号 (runId: run-123456)

[收到恢复请求]

▶️  恢复流 - runId: run-123456
📤 发送事件: TEXT_MESSAGE_CONTENT
📤 发送事件: RUN_FINISHED
✅ 流程完成，清理状态
```

---

## 常见问题排查

### 问题 1: 前端没有收到心跳信号

**症状：** 控制台没有 `💓 收到心跳信号` 日志

**排查步骤：**
1. 检查 Network 面板，SSE 连接是否正常
2. 查看后端终端，是否有 `💓 发送心跳信号` 日志
3. 检查 `src/lib/chat/sse-client.ts`，确认心跳检测逻辑正确

**解决方案：**
```typescript
// src/lib/chat/sse-client.ts:82-87
if (line.trim() === ': heartbeat') {
  console.log('💓 收到心跳信号 - 流已暂停')
  onHeartbeat?.()
  continue
}
```

---

### 问题 2: TaskList 没有变为可编辑状态

**症状：** TaskList 显示但无法编辑

**排查步骤：**
1. 检查 ChatContext 的 `isPaused` 状态是否为 `true`
2. 检查 MessageList 中的 `renderThinkingTaskList` 逻辑

**解决方案：**
```tsx
// src/views/chat-view/components/MessageList/index.tsx:91-93
status={isPaused ? 'pending' : tasklist.status}
editable={isPaused}
```

---

### 问题 3: 点击"确认执行"后没有调用恢复 API

**症状：** 点击按钮无响应

**排查步骤：**
1. 检查 `onConfirmExecute` 回调是否正确传递
2. 检查 `resumeStream` 函数是否存在
3. 查看控制台是否有错误日志

**解决方案：**
```tsx
// src/views/chat-view/components/MessageList/index.tsx:120-130
onConfirmExecute={() => {
  console.log('确认执行 - 调用恢复接口')
  const tasklistData = tasklist.dataSource
  resumeStream({ tasklistData })
}}
```

---

### 问题 4: 恢复后后端没有继续发送事件

**症状：** 调用恢复 API 后，前端不再接收新事件

**排查步骤：**
1. 检查后端终端，是否有 `▶️ 恢复流` 日志
2. 检查后端 `pendingStreams` Map 中是否存在对应的 `runId`
3. 检查恢复接口的请求体是否正确

**解决方案：**
```javascript
// /Users/vvan/test/node-server-clean/index.js:317-463
app.post('/agui/resume', (req, res) => {
  const { runId, formData, tasklistData } = req.body;
  const streamState = pendingStreams.get(runId);
  // ... 恢复逻辑
});
```

---

## 成功标准

当以下所有检查点都通过时，功能测试成功：

- [x] 前端和后端服务器正常启动
- [ ] 发送消息后开始接收 SSE 事件
- [ ] 在 STATE_SNAPSHOT 事件后流式输出暂停
- [ ] TaskList 显示为可编辑状态
- [ ] 收到心跳信号，`isPaused` 变为 `true`
- [ ] 编辑 TaskList 并点击"确认执行"
- [ ] 后端收到恢复请求，继续发送事件
- [ ] 在 dynamic_form 事件后流式输出再次暂停
- [ ] DynamicForm 显示为可填写状态
- [ ] 填写表单并点击"提交"
- [ ] 后端再次收到恢复请求，继续发送剩余事件
- [ ] 流程完整结束，显示 RUN_FINISHED 事件
- [ ] 所有组件变为 `confirmed` 状态（不可编辑）

---

## 下一步行动

1. ✅ 前后端服务器已启动
2. 🔄 **打开浏览器访问 http://localhost:5173**
3. 🔄 **发送测试消息："帮我生成 CSR 报告"**
4. 🔄 **按照测试场景逐步验证功能**
5. 🔄 **记录测试结果，发现问题及时反馈**

---

**祝测试顺利！🎉**
