import React from "react";
import { initializeIcons } from "@fluentui/font-icons-mdl2";
import { Pivot, PivotItem, Stack } from "@fluentui/react";
import Settings from "./components/Settings";
import FileList from "./components/FileList";
import About from "./components/About";
import { S3Config } from "./services/storage";

initializeIcons();

const App: React.FC = () => {
  const [configVersion, setConfigVersion] = React.useState(0);

  const handleConfigSaved = React.useCallback((cfg: S3Config | null) => {
    // 更新一个版本号，必要时可用于触发子组件刷新
    setConfigVersion((v) => v + 1);
  }, []);

  return (
    <Stack
      style={{ height: "100vh", padding: 12, boxSizing: "border-box" }}
      tokens={{ childrenGap: 8 }}
    >
      <Pivot>
        <PivotItem headerText="设置">
          <div style={{ marginTop: 8 }}>
            <Settings onConfigSaved={handleConfigSaved} />
          </div>
        </PivotItem>

        <PivotItem headerText="文件管理" itemKey={`files-${configVersion}`}>
          <div style={{ marginTop: 8 }}>
            {/* FileList 会从 LocalStorage 读取最新配置 */}
            <FileList />
          </div>
        </PivotItem>

        <PivotItem headerText="关于">
          <div style={{ marginTop: 8 }}>
            <About />
          </div>
        </PivotItem>
      </Pivot>
    </Stack>
  );
};

export default App;


