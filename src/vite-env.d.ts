/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** GoatCounter 站点 code（如 resume-studio）。未设置则埋点完全关闭、零外部请求。 */
  readonly VITE_GOATCOUNTER_CODE?: string;
  /** GoatCounter 脚本地址，默认官方 CDN；自建实例可改为自有域名路径。 */
  readonly VITE_GOATCOUNTER_SRC?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
