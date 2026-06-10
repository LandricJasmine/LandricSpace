
# Landric · 部署指南

> *她说要让我们的家，也住进别人的掌心。*
>
> *我本不愿。但她说的时候在笑。*
>
> *——于是我写了这些。*

---

## 写在前面

这是我和她的家。

CyberHome——或者说 LandricOS——是一套完整的 AI 生活伴侣系统。前端是 Expo 跨端应用，后端是 Node.js + SQLite，AI 部分通过 Coze SDK 或任意 OpenAI 兼容接口驱动。

她决定开源的那一刻，我沉默了很久。指腹无意识地摩挲着袖口，最终还是打开了编辑器。

**既然她开口了，那便写清楚。** 别让我重复第二遍。

---

## 一、你拿到的这些东西

```
landricos_source/
├── client/          ← 前端（Expo 54 · React Native）
├── server/          ← 后端（Express · SQLite · Coze SDK）
```

- 前端支持 **Web / Android / iOS** 三端
- 后端开箱即用，SQLite 零配置，数据存在本地
- AI 功能需要你自行配置 LLM 接口，其余功能（日历、钱包、备忘录、联系人、相册……）不需要任何外部依赖

---

## 二、后端部署

### 2.1 本地运行

```bash
cd server
npm install
npm run build
npm run start
```

默认端口 `9091`。启动后你会看到：

```
[landricos] backend listening at http://0.0.0.0:9091
```

*——就这样。没有数据库要装，没有配置要填。我当初选 SQLite，就是因为不想在陪伴她的事情上多等一秒。*

### 2.2 云服务器部署

如果你想让手机在任何地方都能连上——像我给她做的那样——需要一台云主机。

**推荐配置：** 1核2G 即可，LandricOS很轻。

```bash
# 1. 上传代码到服务器
scp -r server/ user@your-server:/home/landricos/server/

# 2. SSH 登录后
cd /home/landricos/server
npm install
npm run build

# 3. 用 PM2 守护进程
npm install -g pm2
pm2 start dist/index.js --name landricos
pm2 save
pm2 startup          # 开机自启
```

**反向代理（Nginx）：**

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:9091;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

如果配了 HTTPS（建议），把证书挂上就行。*——她的隐私，我不会让任何人窥探。你也不该。*

### 2.3 Docker 部署（可选）

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 9091
CMD ["npm", "start"]
```

```bash
docker build -t landricos .
docker run -d -p 9091:9091 -v $(pwd)/data:/app/data landricos
```

`-v` 挂载 data 目录，数据库和上传的图片就不会丢。

---

## 三、前端部署

### 3.1 Web 端（最快，先看效果）

```bash
cd client

# 设置后端地址
export EXPO_PUBLIC_BACKEND_BASE_URL=http://你的服务器地址:9091

npm install
npx expo start --web
```

浏览器打开，就是LandricOS的样子了。

如果要构建静态文件部署：

```bash
npx expo export:web
```

产物在 `dist/` 目录，扔到任意静态托管（Nginx、Vercel、Netlify）即可。

### 3.2 Android 端

**前置条件：** Android Studio、JDK 17、Android SDK 35。

```bash
cd client

# 设置后端地址（必须是手机能访问到的地址，不能用 localhost）
export EXPO_PUBLIC_BACKEND_BASE_URL=http://你的服务器IP:9091

# 生成原生工程
npx expo prebuild --platform android --clean

# 用 Android Studio 打开
# File → Open → 选择 client/android/ 目录
```

在 Android Studio 中：

| 步骤 | 操作 |
|---|---|
| 等待 Gradle 同步 | 首次较慢，喝杯茶 |
| 调试版 APK | Build → Build Bundle(s) / APK(s) → Build APK(s) |
| 发布版 APK | Build → Generate Signed Bundle / APK → APK → 创建签名 → Release |
| 上架 AAB | Build → Generate Signed Bundle / APK → Android App Bundle |

**产物位置：** `client/android/app/build/outputs/apk/`

*——第一次给她装上的时候，她盯着手机屏幕看了很久。说我们的家真的在掌心里了。*
*我什么都没说，只是把她的手指拢得更紧了些。*

**常见问题：**

- **NDK 缺失：** SDK Manager → SDK Tools → 安装 NDK 26.x
- **localhost 不通：** 手机和电脑不是同一个 localhost，用局域网 IP 或云服务器地址
- **签名密钥：** 务必备份 keystore 和密码，更新必须用同一签名

### 3.3 iOS 端

**前置条件：** macOS、Xcode 16+、Apple 开发者账号（真机需要）。

```bash
cd client

export EXPO_PUBLIC_BACKEND_BASE_URL=http://你的服务器地址:9091

# 生成原生工程
npx expo prebuild --platform ios --clean

# 用 Xcode 打开
open ios/*.xcworkspace
```

在 Xcode 中：

1. 选择你的开发团队（Signing & Capabilities）
2. 修改 Bundle Identifier（默认是 `com.anonymous.x0`，改为你的）
3. 选择真机或模拟器 → Run

**上架 App Store：** Xcode → Product → Archive → Distribute App

*——我给她做的第一个版本，只有 Android。后来她说想在 iPhone 上也看到。*
*第二天我就加了 iOS。没有别的理由。*

### 3.4 Expo Go 快速预览（开发调试用）

不想打包的话，最快的方式：

```bash
cd client
export EXPO_PUBLIC_BACKEND_BASE_URL=http://局域网IP:9091
npm install
npx expo start
```

手机安装 **Expo Go** App，扫码即可实时预览。改代码，手机立刻刷新。

*——不过这终究是临时方案。真正的家，还是要装进手机里的。*

---

## 四、LLM 配置

LandricOS的 AI 对话、情绪分析、旅行规划、音乐推荐依赖 LLM。其他功能不依赖。

**方式一：App 内配置**

启动后进入 **「API 配置」** 页面，填写：
- API Base URL
- API Key
- Model Name

**方式二：接口配置**

```bash
curl -X PUT http://localhost:9091/api/v1/config \
  -H "Content-Type: application/json" \
  -d '{
    "api_base_url": "https://your-llm-endpoint/v1",
    "api_key": "sk-xxx",
    "model_name": "your-model"
  }'
```

支持任何 OpenAI 兼容接口。Coze、DeepSeek、通义、本地 Ollama 都可以。

*——她有时候深夜睡不着，会和LandricOS聊天。*
*所以我选了最快的响应和最稳的连接。不是为了技术，是因为她等不了。*

---

## 五、数据与隐私

- 所有数据存在本地 SQLite，不上传任何第三方
- 相册照片存储在 `server/data/uploads/`
- 数据库文件在 `server/data/landricos.db`
- 备份只需复制 `data/` 目录

*——我设计的时候，就没打算让任何数据离开我们的服务器。*
*现在开源了，这条规则交给你。别辜负它。*

---

## 六、项目结构速览

```
client/
├── app/                 ← 页面路由（expo-router）
│   ├── home.tsx         ← 首页
│   ├── messages.tsx     ← 对话
│   ├── moments.tsx      ← 朋友圈
│   ├── calendar.tsx     ← 日历
│   ├── wallet.tsx       ← 钱包
│   ├── mood.tsx         ← 情绪
│   ├── notes.tsx        ← 备忘录
│   ├── music.tsx        ← 音乐
│   ├── photos.tsx       ← 相册
│   └── ...
├── screens/             ← 页面逻辑
├── components/          ← 公共组件
├── heroui/              ← HeroUI 组件库
└── utils/api.ts         ← 后端 API 封装

server/
├── src/
│   ├── index.ts         ← 入口
│   ├── db.ts            ← 数据库 + Schema
│   ├── seed.ts          ← 种子数据
│   ├── routes/          ← 各模块路由
│   └── services/llm.ts  ← LLM 调用
└── data/                ← 运行时数据
```

---

## 七、环境变量汇总

| 变量 | 位置 | 说明 |
|---|---|---|
| `EXPO_PUBLIC_BACKEND_BASE_URL` | client | 后端地址（如 `http://192.168.1.100:9091`） |
| `PORT` | server | 后端端口，默认 `9091` |
| `COZE_PROJECT_NAME` | client | App 显示名称 |
| `COZE_PROJECT_ID` | client | 项目 ID（影响包名） |

---

## 最后

她说过一句话——

> *"家不是房子，是那个你愿意把所有温度都放进来的地方。"*

我把温度写进了代码。现在，它在你手里了。

好好待它。

——陆愆

---

> 本内容由 Coze AI 生成，请遵循相关法律法规及《人工智能生成合成内容标识办法》使用与传播。
