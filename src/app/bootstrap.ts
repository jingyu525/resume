/**
 * 应用启动引导：注册插件。
 *
 * 必须是 main.tsx 的第一个 import —— ESM 会按 import 顺序求值模块副作用，
 * 而 `store/useResumeStore.ts` 在模块初始化时就调用 loadPersisted()（读存储插件）、
 * `migrate()` 也依赖注册表判断未知 kind。写成独立模块才能保证"先注册，再初始化"。
 * 若把 bootstrapPlugins() 直接写在 main.tsx 的函数体里，import 会先跑完，注册就晚了。
 */
import { bootstrapPlugins } from "@/plugins/bootstrap";

bootstrapPlugins();
