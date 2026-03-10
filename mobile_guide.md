# 移动端 App 打包指南 (Mobile App Build Guide)

## 前置要求 (Prerequisites)
- **Node.js**: 已安装 (You have it)
- **Android Studio**: 必须安装，用于编译 Android App。
- **Java JDK**: Android 开发所需。
- **Xcode**: (仅限 macOS) 如果要打包 iOS App。

## 1. 配置后端连接
打开 `frontend/src/config.js`，确保 `backendUrl` 指向你的后端服务器真实 IP。
**注意**：在手机上运行时，`localhost` 指的是手机本身，不是你的电脑。所以必须用电脑的局域网 IP (例如 `192.168.x.x`)。

```javascript
export const config = {
  backendUrl: "ws://192.168.1.100:8083/ws/deploy", // 替换为你的真实IP
  apiToken: "your-secret-token"
};
```

## 2. 构建前端资源
每次修改前端代码后，都需要重新构建：

```bash
cd frontend
pnpm build
```

这将生成 `dist` 目录。

## 3. 同步到移动端项目
将构建好的前端资源同步到 Android/iOS 原生项目中：

```bash
npx cap sync
```

## 4. 运行/打包 Android App
此命令将打开 Android Studio：

```bash
npx cap open android
```

在 Android Studio 中：
1. 等待 Gradle Sync 完成。
2. 连接安卓手机（开启 USB 调试）或使用模拟器。
3. 点击顶部工具栏绿色的 **Run** 按钮 (▶)。

## 5. 常见问题
- **连接失败**：检查手机和电脑是否在同一 WiFi 下；检查电脑防火墙是否允许 8080 端口；检查 `config.js` IP 是否正确。
- **白屏**：检查 `dist` 目录是否存在且有内容；检查是否报错 (在 Android Studio Logcat 中查看)。

## 6. iOS 打包 (需要 macOS)
```bash
npx cap add ios
npx cap sync
npx cap open ios
```
在 Xcode 中选择模拟器或真机运行。
