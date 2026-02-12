import {
  FileText,
  FileImage,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  Copy,
} from "lucide-react";
import type { FileCardActionMenuItemProps } from "@/components/wuhan/blocks/file-card-01";

/**
 * 文件示例数据
 */
export const fileExamples = [
  {
    id: "1",
    title: "项目需求文档.pdf",
    date: "2024-01-15 10:30",
    fileIcon: <FileText className="w-6 h-6 text-[var(--text-brand)]" />,
  },
  {
    id: "2",
    title: "设计稿.png",
    date: "2024-01-14 15:20",
    fileIcon: <FileImage className="w-6 h-6 text-[var(--text-success)]" />,
  },
  {
    id: "3",
    title: "数据统计表.xlsx",
    date: "2024-01-13 09:45",
    fileIcon: (
      <FileSpreadsheet className="w-6 h-6 text-[var(--text-warning)]" />
    ),
  },
] as const;

/**
 * 文件分组数据
 */
export const fileGroup = [
  {
    id: "group1",
    title: "临时上传",
    list: fileExamples?.map((item) => ({ ...item, id: `1-${item.id}` })),
  },
  {
    id: "group2",
    title: "企业知识库",
    list: fileExamples?.map((item) => ({ ...item, id: `2-${item.id}` })),
  },
  {
    id: "group3",
    title: "联网搜索",
    list: fileExamples?.map((item) => ({ ...item, id: `3-${item.id}` })),
  }
];

/**
 * 默认操作菜单项
 */
export const defaultActionMenuItems: FileCardActionMenuItemProps[] = [
  {
    key: "preview",
    label: "预览",
    icon: <Eye className="w-4 h-4" />,
  },
  {
    key: "download",
    label: "下载",
    icon: <Download className="w-4 h-4" />,
  },
  {
    key: "copy",
    label: "复制链接",
    icon: <Copy className="w-4 h-4" />,
  },
  {
    key: "delete",
    label: "删除",
    icon: <Trash2 className="w-4 h-4" />,
    danger: true,
  },
];
