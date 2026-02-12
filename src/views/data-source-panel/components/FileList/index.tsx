import { useCallback, useState, useMemo } from "react";
import { FileCardPrimitive } from "@/components/wuhan/blocks/file-card-01";
import { Checkbox } from "@/components/wuhan/composed/checkbox";
import { fileGroup, defaultActionMenuItems } from "../../mock-data";

/**
 * 文件列表组件
 */
export function FileList() {
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
}
