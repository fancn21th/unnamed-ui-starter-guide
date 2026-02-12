export const goalExamples = [
  // 进行中 - 品牌色
  {
    title: "阅读《设计心理学》",
    description: "第 1 章：可供性",
    progress: 25,
    status: "in_progress" as const,
  },
  {
    title: "阅读《设计心理学》",
    description: "第 3 章：可供性",
    progress: 50,
    status: "in_progress" as const,
  },
  // {
  //   title: "阅读《设计心理学》",
  //   description: "第 5 章：可供性",
  //   progress: 75,
  //   status: "in_progress" as const,
  // },
  // // 完成 - 绿色 + 对号
  // {
  //   title: "阅读《设计心理学》",
  //   description: "全书完成",
  //   progress: 100,
  //   status: "completed" as const,
  // },
] as const;

export const collaborativeUsers = [
  "张伟",
  "王芳",
  "李强",
  "刘洋",
  "陈静",
  "杨帆",
  "赵磊",
  "黄敏",
  "周杰",
  "吴婷",
];

/**
 * Agent 卡片数据
 */
export const agentCards = [
  {
    id: "1",
    title: "撰写岗位JD",
    className: "bg-[#E2F8EC]",
  },
  {
    id: "2",
    title: "简历初筛评估",
    className: "bg-[#EDF2FF]",
  },
  {
    id: "3",
    title: "面试时间推荐",
    className: "bg-[#F8F0FF]",
  },
  {
    id: "4",
    title: "面试会邀及通知",
    className: "bg-[#EBF8FE]",
  },
  {
    id: "5",
    title: "生成面试题",
    className: "bg-[#F4F3FF]",
  },
  {
    id: "6",
    title: "生成面试题",
    className: "bg-[#EAFBFA]",
  },
];

/**
 * 报告卡片数据
 */

export const cards = [
  {
    id: "1",
    title: "候选人评估报告",
    description: "更新时间：08-04 13:56",
  },
  {
    id: "2",
    title: "数据分析报告",
    description: "包含本月所有数据统计信息",
  },
  {
    id: "3",
    title: "绩效评估报告",
    description: "2024年Q4绩效数据汇总",
  },
];
