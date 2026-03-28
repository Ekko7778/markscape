# 书签管理器 - 项目规则

## Git 规则

**禁止在 commit message 中添加 Co-Authored-By 行。** 提交信息只保留 emoji + type(scope): 描述的格式，不要附带任何署名。

## 开发流程

### UI 修改必须用 Chrome DevTools 测试

所有 UI 相关的修改（CSS、HTML、JS 渲染逻辑），完成后必须通过 Chrome DevTools MCP 验证：

1. 用 `navigate_page` 加载页面
2. 用 `evaluate_script` 检查关键元素尺寸、间距、布局
3. 用 `take_screenshot` 截图确认视觉效果
4. 确认无异常后才算完成

**禁止**：改完代码直接说"改好了"而不测试。
