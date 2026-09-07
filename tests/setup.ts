// 测试环境也要注册插件：store 初始化时会读存储插件，migrate() 依赖注册表判断未知 kind/语言。
// 不注册的话这些代码会走"内置清单兜底"，测试与生产行为不一致（M3 新增语言包后会静默丢数据）。
import { bootstrapPlugins } from "@/plugins/bootstrap";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

bootstrapPlugins();

afterEach(() => {
  cleanup();
});
