import React from "react";
import { Stack, Text } from "@fluentui/react";

const About: React.FC = () => {
  return (
    <Stack tokens={{ childrenGap: 8 }}>
      <Text variant="xLarge">关于本插件</Text>
      <Text>版本：v1.0.0</Text>
      <Text>开发者：YourName</Text>
      <Text>
        本 Office 插件用于演示如何在 Excel / Word Task Pane 中通过 AWS S3 管理云端文件，
        包含配置、文件浏览与插入等功能。本示例仅用于学习与演示，不建议直接用于生产环境。
      </Text>
      <Text>© {new Date().getFullYear()} YourName. All rights reserved.</Text>
    </Stack>
  );
};

export default About;


