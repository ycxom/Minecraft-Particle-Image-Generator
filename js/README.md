# 项目结构说明

## 模块化架构

本项目采用 ES6 模块化架构，将功能拆分为多个独立模块。

### 目录结构

```
js/
├── main.js                    # 主入口文件
├── state.js                   # 全局状态管理
├── renderer.js                # 3D 渲染器
├── particle-generator.js      # 粒子生成器
├── ui-manager.js              # UI 管理器
├── command-generator.js       # Minecraft 命令生成器
├── datapack-generator.js      # 数据包生成器
├── export-handlers.js         # 导出功能处理器
└── parsers/                   # 图片解析器模块
    ├── base-parser.js         # 解析器基类
    ├── gif-parser.js          # GIF 解析器
    ├── png-parser.js          # PNG/APNG 解析器
    ├── static-parser.js       # 静态图片解析器
    └── image-parser.js        # 解析器工厂
```

## 模块说明

### 1. state.js - 全局状态管理
管理应用的全局状态，包括：
- 3D 场景对象
- 图片帧数据
- 动画状态
- 当前帧索引

### 2. renderer.js - 3D 渲染器
负责 Three.js 3D 场景的初始化和渲染：
- 场景、相机、渲染器初始化
- 动画循环
- 窗口大小自适应

### 3. parsers/ - 图片解析器模块
采用策略模式，针对不同图片格式使用不同的解析器：

#### base-parser.js
- 提供解析器基类
- 定义通用方法

#### gif-parser.js
- 使用 jsgif 库解析 GIF
- 提供降级方案（Canvas API）
- 支持多帧动画

#### png-parser.js
- 使用 UPNG 库解析 PNG/APNG
- 支持透明通道
- 支持动画 PNG

#### static-parser.js
- 解析 JPG 等静态图片
- 使用 Canvas API

#### image-parser.js
- 解析器工厂
- 根据文件类型委派给对应的解析器

### 4. particle-generator.js - 粒子生成器
负责将图片转换为 3D 粒子：
- 图片缩放
- 颜色提取
- 3D 坐标计算
- 旋转和偏移应用

### 5. ui-manager.js - UI 管理器
管理用户界面交互：
- 文件上传处理
- 参数同步
- 状态显示更新
- 事件监听

### 6. command-generator.js - 命令生成器
生成 Minecraft 命令：
- 支持 1.21+ 新版本格式
- 支持 1.13-1.20.4 旧版本格式
- 支持基岩版格式

### 7. datapack-generator.js - 数据包生成器
生成 Minecraft 数据包：
- 静态图片数据包
- 动画数据包（多帧）
- 循环控制逻辑
- 播放/停止/重启函数

### 8. export-handlers.js - 导出处理器
处理各种导出功能：
- 复制命令到剪贴板
- 生成单指令
- 角度预设

### 9. main.js - 主入口
应用初始化和模块组装：
- 创建所有模块实例
- 初始化应用
- 导出全局函数供 HTML 调用

## 设计模式

### 1. 策略模式（Strategy Pattern）
用于图片解析器，不同格式使用不同策略：
- GIFParser
- PNGParser
- StaticImageParser

### 2. 工厂模式（Factory Pattern）
ImageParser 作为工厂，根据文件类型创建对应的解析器。

### 3. 单例模式（Singleton Pattern）
AppState 作为全局状态管理，确保状态一致性。

### 4. 依赖注入（Dependency Injection）
各模块通过构造函数注入依赖，降低耦合度。

## 优势

1. **模块化**：每个模块职责单一，易于维护
2. **可扩展**：添加新的图片格式只需新增解析器
3. **可测试**：模块独立，便于单元测试
4. **可读性**：代码结构清晰，易于理解
5. **性能**：按需加载，减少初始加载时间

## 使用方式

在 HTML 中使用 ES6 模块：

```html
<script type="module" src="js/main.js"></script>
```

浏览器会自动处理模块依赖关系。

## 注意事项

1. 需要在 HTTP 服务器环境下运行（不能直接打开 file:// 协议）
2. 确保所有外部库（Three.js, JSZip, UPNG, jsgif）已正确加载
3. 浏览器需要支持 ES6 模块（现代浏览器均支持）
