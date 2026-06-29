# AK47 手部持枪系统 - 任务列表

## 任务清单

- [ ] Task 1: 创建 3D AK47 武器几何体模型
  - [ ] SubTask 1.1: 设计 AK47 各部件几何体构建函数
  - [ ] SubTask 1.2: 实现枪管、枪身、枪托、弹匣等主要部件
  - [ ] SubTask 1.3: 将各部件组合为完整 AK47 模型

- [ ] Task 2: 创建左手几何体模型
  - [ ] SubTask 2.1: 设计左手几何体构建函数
  - [ ] SubTask 2.2: 实现手掌和手指简化模型
  - [ ] SubTask 2.3: 将手部与武器组合定位

- [ ] Task 3: 集成武器手部到相机视角
  - [ ] SubTask 3.1: 创建 weaponGroup 作为相机子对象
  - [ ] SubTask 3.2: 设置武器在屏幕上的位置（右下角）
  - [ ] SubTask 3.3: 移除旧的 2D PNG 武器引用

- [ ] Task 4: 实现射击动画和特效
  - [ ] SubTask 4.1: 实现后坐力动画效果
  - [ ] SubTask 4.2: 实现枪口闪光特效
  - [ ] SubTask 4.3: 集成射击动画到射击逻辑

## 任务依赖关系
- Task 3 依赖 Task 1 和 Task 2 完成
- Task 4 依赖 Task 3 完成
