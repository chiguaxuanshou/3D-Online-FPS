# AK47 手部持枪系统规范

## Why
当前游戏使用简单的 2D PNG 图片作为武器模型，缺乏真实感和沉浸感。玩家期望类似 CS:GO2 的第一人称持枪体验，包括逼真的手部模型和 AK47 武器渲染。

## What Changes
- 将现有的 2D PNG 武器图片替换为 3D 手部 + AK47 武器模型
- 实现 CS:GO2 风格的第一人称视角武器展示
- 添加武器动画效果（射击后坐力、开火特效）
- 保持原有的射击逻辑和子弹生成机制

## Impact
- 受影响的规格：射击功能、游戏沉浸感
- 受影响的代码：
  - `index.html` - 修改武器显示区域样式
  - `js/main.js` - 添加 3D 武器和手部模型渲染逻辑

## ADDED Requirements

### Requirement: 3D AK47 武器模型渲染
系统 SHALL 提供 3D AK47 武器模型渲染在第一人称视角中。

#### Scenario: 游戏加载时
- **WHEN** 游戏初始化完成
- **THEN** 3D AK47 模型应显示在屏幕右下角，伴随左手模型

### Requirement: 手部模型渲染
系统 SHALL 提供左手握住武器把手的渲染。

#### Scenario: 武器显示时
- **WHEN** 武器模型渲染
- **THEN** 左手模型应可见地握住武器

### Requirement: 武器射击动画
系统 SHALL 提供射击时的后坐力动画效果。

#### Scenario: 玩家点击射击
- **WHEN** 玩家点击射击
- **THEN** 武器应产生向上的后坐力动画，并在 0.3 秒内恢复原位

### Requirement: 开火特效
系统 SHALL 提供射击时的枪口闪光特效。

#### Scenario: 射击触发时
- **WHEN** 子弹生成
- **THEN** 枪口应显示短暂的光效（持续约 0.05 秒）

## MODIFIED Requirements

### Requirement: 射击逻辑保持
修改射击功能以适配新的 3D 武器系统。

#### Scenario: 玩家射击
- **WHEN** 玩家点击射击
- **THEN** 原有的子弹生成逻辑保持不变，同时触发武器动画和特效

## REMOVED Requirements

### Requirement: 2D PNG 武器图片
**Reason**: 替换为更逼真的 3D 模型
**Migration**: 移除 `img/1.png` 和 `img/2.png` 的引用

## Technical Approach

### 3D 模型方案
使用 Three.js 实现 3D 手部和武器渲染：
1. **武器模型**：使用 Three.js 基础几何体构建简化版 AK47 模型
2. **手部模型**：使用 Three.js 构建简化版左手握住武器
3. **定位**：将武器手部组合体作为相机子对象，保持相对位置

### 模型构建策略
由于没有外部 3D 模型文件，采用代码构建：
- **枪管**：CylinderGeometry
- **枪身**：BoxGeometry 组合
- **枪托**：BoxGeometry
- **弹匣**：BoxGeometry
- **手部**：简化几何体表示手指和手掌

### 渲染层次
- 武器手部作为 HUD 层渲染，不受场景雾化影响
- 使用独立的渲染层或深度测试控制
