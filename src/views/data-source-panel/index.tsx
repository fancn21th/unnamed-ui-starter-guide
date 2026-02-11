import {
  FileText,
  FileImage,
  FileSpreadsheet,
  Download,
  Trash2,
  Eye,
  Copy,
  Globe,
  Plus,
} from "lucide-react";
import { useCallback, useState, useMemo } from "react";

import {
  FileCardPrimitive,
  type FileCardActionMenuItemProps,
} from "@/components/wuhan/blocks/file-card-01";
import { Button } from "@/components/wuhan/composed/block-button";
import { Checkbox } from "@/components/wuhan/composed/checkbox";

const fileExamples = [
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

const fileGroup = [
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
  },
];

// 默认操作菜单项
const defaultActionMenuItems: FileCardActionMenuItemProps[] = [
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
export function DataSourcePanel() {
  // 选中的文件 ID 集合
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  // 获取所有文件 ID
  const allFileIds = useMemo(() => {
    return fileGroup.flatMap((group) => group.list.map((file) => file.id));
  }, []);

  // 计算全选状态
  const selectAllState = useMemo(() => {
    const selectedCount = selectedFiles.size;
    const totalCount = allFileIds.length;

    if (selectedCount === 0) {
      return { checked: false, indeterminate: false };
    } else if (selectedCount === totalCount) {
      return { checked: true, indeterminate: false };
    } else {
      return { checked: false, indeterminate: true };
    }
  }, [selectedFiles, allFileIds]);

  // 切换单个文件的选中状态
  const toggleSelect = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  }, []);

  // 切换全选状态
  const toggleSelectAll = useCallback(() => {
    if (selectedFiles.size === allFileIds.length) {
      // 当前全选，取消全选
      setSelectedFiles(new Set());
    } else {
      // 当前未全选，执行全选
      setSelectedFiles(new Set(allFileIds));
    }
  }, [selectedFiles.size, allFileIds]);

  const handleMenuAction = useCallback((action: string, fileId: string) => {
    console.log(`Action: ${action}, FileId: ${fileId}`);
  }, []);
  /**
   * 渲染顶部操作栏
   */
  const renderHeader = () => {
    return (
      <div className="px-2 h-8 flex gap-2">
        <Button
          variant="outline"
          color="secondary"
          icon={Globe}
          className="p-2 cursor-pointer"
        />
        <Button
          variant="outline"
          color="secondary"
          icon={Plus}
          className="flex-1 cursor-pointer"
        >
          添加来源
        </Button>
      </div>
    );
  };

  /**
   * 渲染文件列表
   */
  const renderFileList = () => {
    return (
      <div className="flex flex-col gap-3 overflow-y-auto">
        <Checkbox
          className="pl-2"
          checked={selectAllState.checked}
          indeterminate={selectAllState.indeterminate}
          onChange={toggleSelectAll}
        >
          全选
        </Checkbox>
        {fileGroup?.map((group) => {
          return (
            <div key={group.id} className="flex flex-col gap-1">
              <div className="pl-2 text-[var(--text-tertiary)] font-size-2">
                {group.title}
              </div>
              {group.list?.map((file) => {
                return (
                  <FileCardPrimitive
                    key={file.id}
                    id={file.id}
                    title={file.title}
                    date={file.date}
                    fileIcon={file.fileIcon}
                    selected={selectedFiles.has(file.id)}
                    actionMenuItems={defaultActionMenuItems.map((item) => ({
                      ...item,
                      onClick: () => handleMenuAction(item.key ?? "", file.id),
                    }))}
                    onSelectChange={() => toggleSelect(file.id)}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };
  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      {renderHeader()}
      {renderFileList()}
    </div>
  );
}
