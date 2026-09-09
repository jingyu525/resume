/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Plausible 域名（如 resume.example.com）。未设置则埋点完全关闭、零外部请求。 */
  readonly VITE_PLAUSIBLE_DOMAIN?: string;
  /** Plausible 脚本地址，默认官方 CDN；自建实例可改为自有域名路径。 */
  readonly VITE_PLAUSIBLE_SRC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
