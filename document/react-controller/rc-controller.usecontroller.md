<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [rc-controller](./rc-controller.md) &gt; [useController](./rc-controller.usecontroller.md)

## useController() function

在组件内使用一个 Controller 子类

<b>Signature:</b>

```typescript
declare function useController<C extends Controller, P = any>(CtrlClass: Klass<[P?], C>, props?: P): [C, ReturnType<C['useHooks']>];
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  CtrlClass | Klass&lt;\[P?\], C&gt; | [Controller](./rc-controller.controller.md) 的子类 |
|  props | P | <i>(Optional)</i> 组件的 <code>props</code> |

<b>Returns:</b>

\[C, ReturnType&lt;C\['useHooks'\]&gt;\]

返回一个元组，内容分别是 [Controller](./rc-controller.controller.md) 实例，以及实例内 [Controller.useHooks()](./rc-controller.controller.usehooks.md) 的返回值
