# AK47 手部持枪系统 - 验证清单

## 功能验证

- [ ] Checkpoint 1: 3D AK47 模型正确渲染在第一人称视角
- [ ] Checkpoint 2: 左手模型可见并正确握住武器把手
- [ ] Checkpoint 3: 武器位置在屏幕右下角，符合 CS:GO2 风格
- [ ] Checkpoint 4: 射击时产生后坐力动画（武器向上跳动后恢复）
- [ ] Checkpoint 5: 射击时枪口产生闪光特效
- [ ] Checkpoint 6: 原有的射击逻辑（子弹生成、同步）保持正常工作

## 代码质量验证

- [ ] Checkpoint 7: 移除 index.html 中的 2D PNG 武器引用
- [ ] Checkpoint 8: weaponGroup 正确作为相机子对象
- [ ] Checkpoint 9: 动画效果使用 requestAnimationFrame 或 clock 同步
- [ ] Checkpoint 10: 代码注释清晰，函数命名规范
