# Apple Touch Icon

此文件应该是一个 180x180 像素的 PNG 图片，用于 iOS 添加到主屏幕。

## 临时方案：
可以将 favicon.svg 导出为 180x180 的 PNG：

```bash
# 使用 ImageMagick 或在线工具转换
convert -background none -size 180x180 favicon.svg apple-touch-icon.png
```

或者手动创建一个简单的图标：
- 背景：渐变色或纯色 #ff6ca8
- 中心：✊ emoji 或游戏相关图标
- 圆角：建议20px
