==9.13 update==
> 在使用webpack构建app时，主要有三种类型的代码：你编写的源代码、源代码所依赖的任何第三方库代码、负责所有模块交互的`webpack runtime`和`manifest`
> 

`manifest` 就是webpack构建时生成的模块映射表，**它告诉webpack runtime如何找到和加载模块**

在`dist/bundle.js` 中，manifest通常看起来是这样：

```jsx
/******/
/***/ "./src/index.js":
/******/ "./src/print.js": 
/******/ "./node_modules/lodash/lodash.js":
```

runtime 和 manifest data 是webpack在浏览器运行时连接模块化应用程序所需的全部代码，包含模块交互时连接模块所需的加载和解析逻辑（这包括已加载到浏览器中的模块、延迟加载尚未加载的模块逻辑）

## how manifest work

1. build时生成映射

当你运行`npm run build` 时，webpack会：

```jsx
// 源代码中的模块引用
import lodash from 'lodash' // 第三方包
import printMe from './print.js' // 相对路径

// webpack 转换为数字 ID
// "./src/print.js" -> 模块ID 639
// "lodash" -> 模块ID 147
```

1. Runtime中的模块注册

build后的bundle会包含一个巨大的对象 `__webpack_modules__` ，类似这样:

```tsx
var __webpack_modules__ = ({
  "./src/index.js": (function(module, exports, __webpack_require__) {
    // 你的 index.js 代码
  }),
  "./src/print.js": (function(module, exports, __webpack_require__) {
    // 你的 print.js 代码  
  }),
  "./node_modules/lodash/lodash.js": (function(module, exports, __webpack_require__) {
    // lodash 库代码
  })
});
```

1. 运行时的模块加载

应用运行时，如果需要加载`./src/print.js`:

```tsx
// webpack runtime会执行:
__webpack_require__("./src/print.js");

// 这会找到对应的函数并执行:
__webpack_modules__["./src/print.js"].call(module.exports, module, module.exports, __webpack_require__);
```

这样，manifest这个映射表，就能够在开发时帮助webpack监测循环依赖，在生产时优化bundle体积，移除未被使用的代码，热更新时也知道哪些模块需要重新加载

## 场景

我们熟悉的`React.lazy` 只是语法糖，底层还是webpack的代码分割

```tsx
// webpack中的动态导入/代码分割
import('./heavy-module.js').then(module => {
	// 这个模块会被打包到单独的chunk中
})

// 等同于React.lazy - 组件级别的懒加载
const LazyComp = React.lazy(() => import('./HeavyComponent'))
```

具体在js中的做法（例：不再静态导入lodash，而是通过动态导入来分离出一个chunk）：

```tsx
async function getComponent() {
  try {
    const { default: _ } = await import("lodash");
    const el = document.createElement("div");

    el.innerHTML = _.join(["hello", "webpack"], " ");
    return el;
  } catch (err) {
    return "An err occurred while loading the component";
  }
}

getComponent().then((comp) => {
  document.body.appendChild(comp);
});

```

再比如路由级别的组件分割

```tsx
// 每个路由页面单独打包
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard'),
  },
  {
    path: '/analytics', 
    component: () => import('./pages/Analytics'),
  }
];
```

另外，[`WebpackManifestPlugin`](https://github.com/shellscape/webpack-manifest-plugin) 插件可以将 manifest 数据提取为 json 文件

![截屏2025-09-13 13.26.16.png](attachment:aa19eb9c-8a28-4e11-8841-72863858e431:截屏2025-09-13_13.26.16.png)

## prefetch & preload

顺便聊一下`prefetch（预获取）` 和`preload（预加载）` 的区别(webpack 4.6+）

**prefetch: 将来某些导航下可能需要的资源**

**preload: 当前导航下可能需要的资源**

- 预加载 chunk 会在父 chunk 加载时以`并行`方式开始加载；而预获取 chunk 会在父 chunk 加载`结束后`开始加载。
- 预加载 chunk 具有中等优先级，并会`立即下载`；而预获取 chunk 则在浏`览器闲置时`下载。
- 预加载 chunk 会在父 chunk 中立即请求，用于当下时刻；而预获取 chunk 则用于未来的某个时刻。
- 浏览器支持程度不同。