# 3D射击游戏二次开发 - 实现计划

## [x] Task 1: 搭建项目基础架构
- **Priority**: high
- **Depends On**: None
- **Description**: 
  - 将现有app.js重构为Express框架结构
  - 添加SQLite数据库支持
  - 安装必要依赖（express, jsonwebtoken, bcryptjs, sqlite3）
  - 创建项目目录结构（routes, controllers, models, middleware）
- **Acceptance Criteria Addressed**: FR-1.1, FR-1.2, FR-1.3
- **Test Requirements**:
  - `programmatic` TR-1.1: Express服务器正常启动在8000端口
  - `programmatic` TR-1.2: SQLite数据库连接成功
- **Notes**: 保留现有Socket.io功能，逐步迁移到Express框架

## [x] Task 2: 实现用户注册登录API
- **Priority**: high
- **Depends On**: Task 1
- **Description**: 
  - 创建用户模型（users表：id, username, password_hash, created_at）
  - 实现注册API（POST /api/auth/register）
  - 实现登录API（POST /api/auth/login）
  - 添加JWT认证中间件
  - 前端添加登录/注册界面
- **Acceptance Criteria Addressed**: FR-1.1, FR-1.2, FR-1.3, FR-1.4, AC-1, AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: POST /api/auth/register 返回201状态码
  - `programmatic` TR-2.2: POST /api/auth/login 返回200和JWT令牌
  - `programmatic` TR-2.3: 重复用户名注册返回409错误
  - `human-judgment` TR-2.4: 登录界面UI友好，操作流程清晰
- **Notes**: 使用bcryptjs进行密码哈希，JWT令牌有效期24小时

## [x] Task 3: 实现战绩统计系统
- **Priority**: high
- **Depends On**: Task 2
- **Description**: 
  - 创建战绩模型（stats表：user_id, kills, deaths, level, created_at）
  - 创建武器使用统计模型（weapon_stats表：user_id, weapon_type, usage_count）
  - 服务器端记录击杀/死亡事件
  - 实现战绩查询API（GET /api/stats/:userId）
  - 前端显示个人战绩信息
- **Acceptance Criteria Addressed**: FR-2.1, FR-2.2, FR-2.3, FR-2.4, AC-3
- **Test Requirements**:
  - `programmatic` TR-3.1: 击杀事件正确更新kills计数
  - `programmatic` TR-3.2: 死亡事件正确更新deaths计数
  - `programmatic` TR-3.3: GET /api/stats/:userId 返回正确的K/D比和胜率
  - `human-judgment` TR-3.4: 战绩显示清晰，数据准确
- **Notes**: 等级计算公式：level = floor(kills / 10) + 1

## [x] Task 4: 实现全球排行榜功能
- **Priority**: high
- **Depends On**: Task 3
- **Description**: 
  - 实现击杀排行榜API（GET /api/rankings/kills）
  - 实现胜率排行榜API（GET /api/rankings/winrate）
  - 实现等级排行榜API（GET /api/rankings/level）
  - 前端添加排行榜界面
  - 实现排行榜数据定期刷新
- **Acceptance Criteria Addressed**: FR-3.1, FR-3.2, FR-3.3, FR-3.4, AC-4
- **Test Requirements**:
  - `programmatic` TR-4.1: 排行榜按正确字段排序（降序）
  - `programmatic` TR-4.2: 排行榜返回前10名玩家数据
  - `human-judgment` TR-4.3: 排行榜界面美观，切换流畅
- **Notes**: 胜率 = wins / (wins + losses)，每击杀10人升级

## [x] Task 5: 实现新武器系统
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 在客户端定义三种武器属性（狙击枪、火箭筒、近战）
  - 实现武器切换逻辑（数字键1-3）
  - 实现不同武器的射击效果（子弹速度、伤害、射程）
  - 狙击枪添加瞄准镜功能（右键缩放）
  - 火箭筒添加范围伤害和延迟爆炸效果
  - 前端显示当前武器和弹药数量
- **Acceptance Criteria Addressed**: FR-4.1, FR-4.2, FR-4.3, FR-4.4, AC-5, AC-6
- **Test Requirements**:
  - `human-judgment` TR-5.1: 数字键1-3正确切换武器
  - `human-judgment` TR-5.2: 狙击枪右键进入瞄准模式，视野放大
  - `human-judgment` TR-5.3: 火箭筒发射后延迟爆炸，造成范围伤害
  - `human-judgment` TR-5.4: 近战武器近距离攻击有效
- **Notes**: 武器属性：狙击枪(伤害100,射速1,射程1000)、火箭筒(伤害150,射速0.5,射程500)、近战(伤害80,射速3,射程5)

## [x] Task 6: 实现房间系统
- **Priority**: medium
- **Depends On**: Task 2
- **Description**: 
  - 服务器端实现房间管理（创建、加入、退出）
  - 创建房间模型（rooms表：id, name, max_players, owner_id, status）
  - 实现创建房间API（POST /api/rooms）
  - 实现加入房间API（POST /api/rooms/:id/join）
  - 实现房间列表API（GET /api/rooms）
  - 前端添加房间列表和等待大厅界面
  - 实现Socket.io房间隔离
- **Acceptance Criteria Addressed**: FR-5.1, FR-5.2, FR-5.3, FR-5.4, AC-7, AC-8
- **Test Requirements**:
  - `programmatic` TR-6.1: POST /api/rooms 创建房间成功，返回房间ID
  - `programmatic` TR-6.2: POST /api/rooms/:id/join 成功加入房间
  - `programmatic` TR-6.3: 房间人数达到上限后无法加入
  - `human-judgment` TR-6.4: 等待大厅显示房间信息和玩家列表
- **Notes**: 房间状态：waiting（等待中）、playing（游戏中）、closed（已关闭）

## [x] Task 7: 实现击杀回放功能
- **Priority**: medium
- **Depends On**: None
- **Description**: 
  - 在客户端创建操作记录队列（位置、视角、子弹、时间戳）
  - 实现10秒环形缓冲区记录机制
  - 实现回放渲染逻辑（重放记录的操作）
  - 击杀事件触发回放
  - 实现回放控制（播放/暂停）
- **Acceptance Criteria Addressed**: FR-6.1, FR-6.2, FR-6.3, AC-9
- **Test Requirements**:
  - `human-judgment` TR-7.1: 击杀后自动播放回放
  - `human-judgment` TR-7.2: 回放显示最后10秒的操作
  - `human-judgment` TR-7.3: 回放可以正常播放和暂停
- **Notes**: 回放仅在本地记录，不发送到服务器，减少网络开销

## [x] Task 8: 服务器部署配置
- **Priority**: low
- **Depends On**: Task 1-6
- **Description**: 
  - 创建Nginx配置文件（反向代理）
  - 创建Systemd服务配置文件
  - 编写部署脚本（deploy.sh）
  - 添加HTTPS配置说明（使用Let's Encrypt）
- **Acceptance Criteria Addressed**: FR-7.1, FR-7.2, FR-7.3, FR-7.4, AC-10
- **Test Requirements**:
  - `programmatic` TR-8.1: Nginx配置文件语法正确
  - `programmatic` TR-8.2: Systemd服务可以正常启动和停止
  - `programmatic` TR-8.3: 部署脚本可以执行
- **Notes**: 部署脚本包含npm install、构建、服务重启等步骤

## [x] Task 9: 测试和优化
- **Priority**: high
- **Depends On**: Task 1-8
- **Description**: 
  - 测试多人游戏场景（2-4人同时在线）
  - 优化性能（减少网络传输、优化渲染）
  - 修复bug和问题
  - 验证所有功能正常工作
- **Acceptance Criteria Addressed**: NFR-1, NFR-2
- **Test Requirements**:
  - `programmatic` TR-9.1: 游戏帧率保持在60FPS以上
  - `human-judgment` TR-9.2: 多人游戏体验流畅，无明显延迟
  - `human-judgment` TR-9.3: 所有功能正常工作，无崩溃
- **Notes**: 使用stats.js监控帧率，优化Socket.io事件频率