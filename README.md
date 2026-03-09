# Vue 3 + Vant

基于 Vite 的 Vue 3 项目，UI 使用 [Vant 4](https://vant-ui.github.io/vant/) 组件库。

## 开发

```bash
node 16
npm install
npm run dev
```

## 构建

```bash
npm run build
```

## 使用 Vant 组件

已配置按需引入，在任意 `.vue` 中直接使用 Vant 组件即可，无需手动 import：

```vue
<template>
  <van-button type="primary">按钮</van-button>
  <van-cell title="单元格" value="内容" />
</template>
```

更多组件见 [Vant 文档](https://vant-ui.github.io/vant/)。

## 环境说明

- 当前使用 Vite 4，兼容 Node 16。若已安装 Node 18+，可将 `vite` 与 `@vitejs/plugin-vue` 升级到最新版。
