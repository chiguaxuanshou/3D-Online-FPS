# AdWebHW2 Code Wiki

## 项目概述

AdWebHW2 是一个基于 WebGL 的多人第一人称射击游戏项目，利用 **Three.js**、**Socket.io** 和 **Node.js** 技术栈搭建。项目实现了玩家在 3D 场景中的实时移动、射击、以及多玩家之间的互动。

**技术栈：**
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | - | 服务端运行环境 |
| Three.js | ^0.77.1 | 3D 场景渲染引擎 |
| Socket.io | ^1.4.6 | 实时双向通信 |
| jQuery | - | DOM 操作辅助 |

---

## 项目架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                        客户端 (Browser)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │   index.html │──▶│   js/main.js │◀──│   js/libs/*.js       │ │
│  │  (页面结构)   │   │  (游戏逻辑)   │   │  (第三方库)          │ │
│  └──────────────┘   └──────────────┘   └──────────────────────┘ │
│          │                  │                                    │
│          │ 渲染             │ 通信                               │
│          ▼                  ▼                                    │
│  ┌──────────────┐   ┌──────────────┐                            │
│  │   Three.js   │   │  Socket.io   │                            │
│  │  (3D渲染引擎) │   │  (实时通信)   │                            │
│  └──────────────┘   └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
                              │ WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        服务端 (Node.js)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐ │
│  │    app.js    │──▶│ Socket.io    │──▶│    Three.js          │ │
│  │  (HTTP服务)   │   │  (连接管理)   │   │  (碰撞检测计算)      │ │
│  └──────────────┘   └──────────────┘   └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 目录结构

```
/workspace/
├── app.js                    # Node.js 服务端入口
├── index.html                # 前端页面入口
├── package.json              # 项目依赖配置
├── README.md                 # 项目说明文档
├── img/                      # 图片资源目录
│   ├── 1.png, 2.png          # 枪支图片
│   ├── camera.png            # 相机示意图
│   ├── demo.png              # 游戏截图
│   └── gun.png               # 枪支图标
├── js/
│   ├── main.js               # 前端核心游戏逻辑
│   └── libs/                 # 第三方库
│       ├── Three.js          # Three.js 核心库
│       ├── FirstPersonControls.js  # 第一人称控制器
│       ├── jquery.js         # jQuery 库
│       └── stats.min.js      # 性能监控插件
├── models/
│   ├── animated/             # 动画模型
│   │   ├── flamingo.js       # 火烈鸟模型
│   │   ├── parrot.js         # 鹦鹉模型
│   │   └── stork.js          # 鹳模型
│   └── skinned/              # 蒙皮骨骼模型
│       └── simple/
│           ├── simple.blend  # Blender 源文件
│           └── simple.js     # 玩家角色模型
└── textures/
    ├── cube/
    │   └── skybox/           # 天空盒纹理
    │       ├── px.jpg, nx.jpg
    │       ├── py.jpg, ny.jpg
    │       └── pz.jpg, nz.jpg
    └── sprite.png            # 子弹纹理
```

---

## 主要模块职责

### 1. 服务端模块 (`app.js`)

**职责**：提供 HTTP 静态文件服务，管理 Socket.io 连接，处理多玩家状态同步和碰撞检测。

**核心功能**：
- HTTP 服务器搭建，提供静态文件服务
- Socket.io 连接管理（连接、断开）
- 玩家位置同步广播
- 子弹状态同步广播
- 服务端碰撞检测（子弹与玩家距离判定）

### 2. 前端入口模块 (`index.html`)

**职责**：定义页面结构和样式，引入必要的 JavaScript 库。

**核心功能**：
- 页面布局（标题、枪支图片、版权信息）
- 引入 Socket.io、jQuery、Three.js 等库
- 设置全屏游戏画布样式

### 3. 前端游戏逻辑模块 (`js/main.js`)

**职责**：实现 3D 场景渲染、用户交互、游戏状态管理和 Socket 通信。

**核心功能**：
- Three.js 场景初始化（相机、灯光、天空盒、地面）
- 第一人称控制（WASD 移动、鼠标视角）
- 子弹系统（发射、更新、边界检测）
- 玩家模型管理（其他玩家的显示和更新）
- 飞鸟动画系统
- Socket.io 通信（事件监听和发送）
- 碰撞反馈（击杀提示、重生）

### 4. 第三方库模块 (`js/libs/`)

| 文件 | 职责 |
|------|------|
| `Three.js` | WebGL 3D 渲染引擎核心 |
| `FirstPersonControls.js` | 第一人称视角控制（键盘移动、鼠标旋转） |
| `jquery.js` | DOM 操作和事件绑定 |
| `stats.min.js` | 帧率性能监控 |

---

## 关键类与函数说明

### 服务端关键函数 (`app.js`)

#### `server(req, res)`

**功能**：HTTP 请求处理器，提供静态文件服务

**参数**：
- `req`: HTTP 请求对象
- `res`: HTTP 响应对象

**实现逻辑**：
1. 解析请求路径，默认返回 `index.html`
2. 读取文件内容并返回
3. 处理 404 错误

```javascript
function server(req, res) {
    var path = url.parse(req.url).pathname;
    if (path == '/') path = '/index.html';
    fs.readFile(__dirname + path, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.write('404 not found: ' + path);
        } else {
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write(data, 'utf8');
        }
        res.end();
    });
}
```

#### `bulletHandler()`

**功能**：子弹逻辑处理器，每帧更新子弹位置并检测碰撞

**实现逻辑**：
1. 遍历所有子弹，更新位置（位置 += 速度向量）
2. 检测子弹与玩家距离（距离 ≤ 10 判定击中）
3. 处理击中事件，广播 `hit` 事件给所有玩家
4. 检测子弹是否出界，移除出界子弹

**调用频率**：`setInterval(bulletHandler, 1000 / 60)` 即 60 FPS

---

### 客户端关键函数 (`js/main.js`)

#### `init()`

**功能**：初始化游戏场景

**初始化内容**：
1. **Stats 监控**：创建性能监控面板
2. **Camera**：透视投影相机，随机初始位置
3. **Scene**：创建场景对象
4. **Light**：平行光源
5. **Skybox**：6 面纹理立方体天空盒
6. **Ground**：随机颜色三角形网格地面
7. **Birds**：加载飞鸟动画模型（鹳、鹦鹉）
8. **Renderer**：WebGL 渲染器
9. **Controls**：第一人称控制器
10. **Player Factory**：加载玩家角色模型作为克隆模板

#### `animate()`

**功能**：游戏主循环，每帧更新游戏状态

**更新内容**：
1. 发送玩家位置到服务端
2. 更新所有子弹位置
3. 检测子弹边界并移除出界子弹
4. 限制玩家在战场范围内
5. 调用 `render()` 渲染场景

**帧率控制**：使用 `requestAnimationFrame(animate)` 实现动态帧率

#### `render()`

**功能**：场景渲染函数

**渲染内容**：
1. 更新飞鸟位置和动画
2. 更新第一人称控制器
3. 更新玩家角色动画
4. 渲染场景到画布

#### `restrictField(controls, restrict)`

**功能**：限制玩家在战场范围内移动

**参数**：
- `controls`: FirstPersonControls 实例
- `restrict`: 边界限制值（默认 500）

**实现逻辑**：
- X/Z 坐标限制在 [-restrict, restrict] 范围内
- Y 坐标固定为 25（相机高度）

#### `playerHandler(id, position)`

**功能**：处理其他玩家状态更新

**参数**：
- `id`: 玩家 Socket ID
- `position`: 玩家位置向量

**实现逻辑**：
- 如果玩家不存在，调用 `addPlayer()` 创建
- 如果玩家已存在，调用 `updatePlayer()` 更新位置

#### `addPlayer(id, x, y, z)`

**功能**：添加新玩家到场景

**参数**：
- `id`: 玩家 Socket ID
- `x, y, z`: 玩家坐标

**实现逻辑**：
- 克隆 `playerFactory` 创建玩家模型
- 设置位置并添加到场景
- 创建动画混合器播放动画
- 存储到 `players` 对象中

#### `updatePlayer(id, x, y, z)`

**功能**：更新玩家位置

**参数**：
- `id`: 玩家 Socket ID
- `x, y, z`: 新坐标

#### `AddBullet(position, speed)`

**功能**：创建子弹

**参数**：
- `position`: 子弹初始位置
- `speed`: 子弹速度向量

**实现逻辑**：
- 创建 Sprite 粒子作为子弹
- 设置位置和缩放
- 添加到 `bullets` 数组和场景

#### `Bullet(particle, speed)`

**功能**：子弹构造函数

**参数**：
- `particle`: THREE.Sprite 实例
- `speed`: THREE.Vector3 速度向量

---

### Socket 事件说明

#### 服务端事件

| 事件名 | 触发时机 | 数据格式 | 处理逻辑 |
|--------|----------|----------|----------|
| `connection` | 客户端连接 | - | 发送 `init` 事件，返回玩家 ID |
| `player` | 玩家位置更新 | `[position]` | 广播给其他玩家 |
| `bullet` | 玩家发射子弹 | `[position, speed]` | 存储子弹并广播 |
| `disconnect` | 玩家断开连接 | - | 删除玩家并广播下线 |

#### 客户端事件

| 事件名 | 触发时机 | 数据格式 | 处理逻辑 |
|--------|----------|----------|----------|
| `init` | 连接成功 | `socketID` | 保存玩家 ID |
| `player` | 其他玩家状态变化 | `{online/offline}` | 添加/移除/更新玩家 |
| `bullet` | 其他玩家发射子弹 | `[position, speed]` | 创建子弹并添加到场景 |
| `hit` | 有玩家被击中 | `{hit, by}` | 处理击杀逻辑（弹窗/移除） |
| `connect` | 连接建立 | - | 日志记录 |
| `disconnect` | 连接断开 | - | 日志记录 |
| `reconnect` | 重连成功 | - | 日志记录 |

---

## 依赖关系

### 服务端依赖 (`package.json`)

```json
{
  "dependencies": {
    "socket.io": "^1.4.6",
    "three": "^0.77.1"
  }
}
```

### 客户端依赖加载顺序 (`index.html`)

```html
1. /socket.io/socket.io.js     <!-- Socket.io 客户端库 -->
2. js/libs/jquery.js           <!-- jQuery -->
3. js/libs/Three.js            <!-- Three.js 核心 -->
4. js/libs/FirstPersonControls.js  <!-- 第一人称控制器 -->
5. js/libs/stats.min.js        <!-- 性能监控 -->
6. js/main.js                  <!-- 游戏主逻辑 -->
```

### 模块间依赖关系

```
app.js
├── http (Node.js 内置)
├── fs (Node.js 内置)
├── url (Node.js 内置)
├── three (用于碰撞检测)
└── socket.io (用于实时通信)

main.js
├── socket.io (通信)
├── jquery (事件绑定)
├── Three.js (3D渲染)
│   ├── PerspectiveCamera
│   ├── Scene
│   ├── DirectionalLight
│   ├── Mesh / Sprite
│   ├── AnimationMixer
│   └── JSONLoader
├── FirstPersonControls (控制)
└── stats.min.js (性能监控)
```

---

## 项目运行方式

### 环境要求

- Node.js (推荐 LTS 版本)
- npm 包管理器

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/song-hao/AdWebHW2.git
cd AdWebHW2

# 安装依赖
npm install
```

### 启动服务

```bash
node app.js
```

### 访问游戏

在浏览器中访问：`http://localhost:8000/`

### 游戏操作

| 操作 | 按键 |
|------|------|
| 向前移动 | W / ↑ |
| 向后移动 | S / ↓ |
| 向左移动 | A / ← |
| 向右移动 | D / → |
| 视角旋转 | 鼠标移动 |
| 射击 | 鼠标左键点击 |

### 游戏规则

1. 玩家进入游戏后获得随机初始位置
2. 使用 WASD 键移动，鼠标控制视角
3. 点击鼠标左键发射子弹
4. 子弹击中其他玩家判定为击杀
5. 被击杀后可选择重新开始或退出

---

## 核心数据流

### 玩家连接流程

```
客户端                    服务端
  │                          │
  │── socket.connect() ─────▶│
  │                          │
  │◀── init (socketID) ──────│
  │                          │
  │── player (position) ────▶│
  │                          │
  │◀── player (online) ──────│  广播其他玩家信息
```

### 射击流程

```
客户端A                   服务端                    客户端B/C
  │                          │                          │
  │── bullet(pos,speed) ────▶│                          │
  │                          │── bullet(pos,speed) ────▶│
  │                          │                          │  创建子弹
  │                          │                          │
  │   本地创建子弹            │                          │   远程创建子弹
  │                          │                          │
  │                          │── hit (hit,by) ────────▶│  击中检测
  │◀───────────────────────────────────────────────────│
```

### 碰撞检测流程

```
服务端每帧执行 bulletHandler():
1. 更新子弹位置
2. 遍历所有在线玩家
3. 计算子弹与玩家距离
4. 如果距离 ≤ 10，判定击中
5. 广播 hit 事件给所有客户端
6. 检测子弹出界，移除出界子弹
```

---

## 技术亮点

### 1. 服务端碰撞检测

使用 Three.js 在服务端进行向量距离计算，确保碰撞判定的权威性和一致性。

### 2. 对象池模式

通过 `playerFactory.clone()` 克隆玩家模型，避免频繁创建对象带来的性能开销。

### 3. 动态帧率控制

使用 `requestAnimationFrame` 实现动态帧率，根据设备性能自动调整渲染频率。

### 4. 天空盒技术

利用 6 面立方体纹理构建沉浸式游戏环境。

### 5. 骨骼动画

使用 SkinnedMesh 和 AnimationMixer 实现玩家角色的骨骼动画。

### 6. 形态目标动画

使用 MorphTargets 实现飞鸟的翅膀扇动动画。

---

## 项目扩展建议

1. **添加音效系统**：射击声、击杀提示音
2. **实现计分系统**：记录击杀数和死亡数
3. **添加游戏房间**：支持多房间游戏
4. **优化网络同步**：使用插值减少延迟带来的抖动
5. **添加障碍物**：在场景中添加可遮挡的障碍物
6. **实现武器系统**：多种武器类型，不同弹道和伤害
7. **添加游戏状态**：开始、暂停、结束状态管理
8. **移动端适配**：添加触摸控制支持