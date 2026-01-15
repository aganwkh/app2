import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.wanxiangzhi.app', // App 的身份证号
  appName: '万象志',           // 手机上显示的名字
  webDir: 'dist',              // 核心！必须是 dist，因为 Vite 打包生成这个文件夹
  bundledWebRuntime: false
};

export default config;