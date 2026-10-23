# Remote Deployer

> 手机端远程部署工具 —— 出门在外，掏出手机点一下就能部署前后端服务。

[![Vue](https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js&logoColor=white)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Capacitor](https://img.shields.io/badge/Capacitor-5.7-119EFF?logo=capacitor&logoColor=white)](https://capacitorjs.com/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Platform](https://img.shields.io/badge/Platform-Android-3DDC84?logo=android&logoColor=white)](#)

---

## 这个项目解决什么问题

有时候服务器需要临时部署一下，但人不在电脑前 —— 可能在外面，可能只有一部手机。

**Remote Deployer** 把这些事压缩成三步：**选端口 → 选分支 → 点「开始部署」**。部署过程中的 Git 拉取、构建、重启日志会通过 WebSocket 实时推送到手机屏幕上，像看终端一样看着它跑完。

底部是一个暗色终端面板，输出逐行滚动，部署结束后自动断开连接。

## 截图与界面

界面由三部分组成：

| 区域 | 说明 |
| --- | --- |
| **顶栏** | 标题 + 连接状态指示灯（灰=未连接 / 绿=已连接）+ 状态文字 |
| **操作卡片** | 端口选择、Git 分支选择、「开始部署」按钮（部署中变为旋转 loading） |
| **控制台** | 等宽字体的实时日志流，支持一键清空，自动滚动到底部 |

## 技术栈

| 层 | 选型 |
| --- | --- |
| 框架 | Vue 3（`<script setup>` 组合式 API） |
| 状态管理 | Pinia |
| 构建 | Vite 5 |
| 样式 | Tailwind CSS 3 |
| 通信 | 原生 WebSocket（实时日志流） |
| 打包 | Capacitor 5 → Android（iOS 需 macOS） |

## 工作原理

```
┌─────────────┐    WebSocket     ┌──────────────┐
│  手机 App   │ ───────────────▶ │  Golang 后端 │
│ (Vue/Capacitor) │  ws://.../ws/deploy │  部署服务 │
│             │ ◀─────────────── │              │
│  实时日志   │   JSON 日志流    │ git pull → 构建 → 重启 │
└─────────────┘                  └──────────────┘
```

1. App 连接时把 `token`、`port`、`branch` 作为查询参数带到 WebSocket 上
2. 后端校验 token 后，按指定分支执行拉取与构建，并逐步推送日志
3. 前端解析 `{ type, content }` 格式的消息，按类型给日志着色
4. 收到 `{ type: "status", content: "done" }` 即表示部署完成，自动关闭连接

> **注意**：部署的实质逻辑（拉哪个仓库、跑什么命令、怎么重启）都在**后端**，本仓库只包含前端与 Android 壳工程。

## 快速开始

### 环境要求

- Node.js 18+
- pnpm
- Android 打包另需：Android Studio + JDK

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置后端地址

编辑 `src/config.js`：

```js
export const config = {
  // 后端 WebSocket 地址
  backendUrl: "ws://你的服务器IP:8083/ws/deploy",

  // 必须与后端 config.yaml 中的 api_token 一致
  apiToken: "your-secret-token",

  // 可选端口
  ports: [
    { value: "8081", label: "8081 (生产)" },
    { value: "8082", label: "8082 (测试)" },
    { value: "8083", label: "8083 (开发)" },
  ],

  // 可选分支
  branches: [
    { value: "back_branch", label: "back_branch (后端主分支)" },
    { value: "main", label: "main (主分支)" },
    { value: "dev", label: "dev (开发分支)" },
  ]
};
```

> 💡 **在手机上调试时**，`localhost` 指的是手机自己，必须填电脑的局域网 IP，例如 `ws://192.168.1.100:8083/ws/deploy`。同时确保手机与电脑在同一 WiFi 下。

### 3. 网页端调试

```bash
pnpm dev
```

浏览器直接打开，适合快速验证逻辑和调整界面。

### 4. 打包成 Android App

```bash
pnpm build          # 生成 dist/
npx cap sync        # 同步到 Android 工程
npx cap open android # 打开 Android Studio
```

在 Android Studio 里 Gradle Sync 完成后，连接手机（开启 USB 调试）或使用模拟器，点击绿色 **Run** 按钮即可安装。

详细的打包步骤见 [mobile_guide.md](mobile_guide.md)。

## 项目结构

```
remote-deployer/
├── src/
│   ├── App.vue                  # 根组件
│   ├── main.js                  # 入口
│   ├── config.js                # ⭐ 后端地址 / token / 端口 / 分支配置
│   ├── components/
│   │   └── DeployConsole.vue    # 主界面：操作卡片 + 终端日志
│   ├── stores/
│   │   └── deployStore.js       # Pinia store：WebSocket 连接与日志管理
│   └── style.css
├── android/                     # Capacitor 生成的 Android 工程
├── capacitor.config.json        # Capacitor 配置（appId / 允许的域名）
├── vite.config.js
├── tailwind.config.js
├── mobile_guide.md              # 移动端打包详细指南
└── project_status.md            # 项目进度记录
```

## 核心逻辑

部署流程集中在 `src/stores/deployStore.js` 的 `connectAndDeploy()`：

```js
const url = `${backendUrl}?token=${apiToken}&port=${selectedPort.value}&branch=${selectedBranch.value}`;
socket = new WebSocket(url);

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'status' && data.content === 'done') {
    isDeploying.value = false;
    socket.close();
    return;
  }
  logs.value.push(data);
};
```

状态由 `isDeploying` 与 `isConnected` 两个 ref 驱动，界面上按钮禁用、指示灯颜色都绑定在它们身上。

## 常见问题

<details>
<summary><b>连接失败 / 一直显示未连接</b></summary>

依次检查：

1. 手机与后端是否在同一网络（或后端是否公网可达）
2. `config.js` 里的 IP 是否正确，端口是否放行
3. 服务器防火墙是否允许该端口（如 8083）
4. 后端服务本身是否在运行
</details>

<details>
<summary><b>App 打开是白屏</b></summary>

`dist/` 目录不存在或内容为空。先执行 `pnpm build`，再执行 `npx cap sync`，然后重新运行。
</details>

<details>
<summary><b>部署按钮点了没反应</b></summary>

打开浏览器控制台看 WebSocket 报错。最常见的是 token 不匹配 —— `config.js` 的 `apiToken` 必须与后端 `config.yaml` 里的 `api_token` 完全一致。
</details>

<details>
<summary><b>iOS 能用吗</b></summary>

原理上可以（`@capacitor/ios` 已在依赖里），但打包必须用 macOS + Xcode：

```bash
npx cap add ios
npx cap sync
npx cap open ios
```

本仓库目前只提交了 `android/` 工程。
</details>

## 已知限制

- **token 明文传输**：`ws://` 不加密，token 直接出现在 URL 查询参数里。建议后续改用 `wss://`，并把 token 放进握手 Header
- **单次连接单次部署**：一次部署一个连接，完成后即断开
- **后端不在本仓库**：部署脚本、构建命令、重启策略需自行实现

## License

本项目未指定开源许可证。
