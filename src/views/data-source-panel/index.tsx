import { DataSourceHeader } from "./components/DataSourceHeader";
import { FileList } from "./components/FileList";

export function DataSourcePanel() {
  return (
    <div className="flex flex-col gap-3 h-full overflow-hidden">
      <DataSourceHeader />
      <FileList />
    </div>
  );
}
