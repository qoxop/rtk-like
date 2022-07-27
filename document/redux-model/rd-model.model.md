<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [rd-model](./rd-model.md) &gt; [Model](./rd-model.model.md)

## Model type

Model 对象数据结构

<b>Signature:</b>

```typescript
declare type Model<STATE extends ValidObj, MCRA extends ModelCaseReducerActions<STATE>, SIF extends InferModelFetch<STATE>> = {
    name?: string;
    reducer: Reducer<STATE>;
    actions: InferModelActions<MCRA>;
    getState: () => STATE;
    useModel: <T = STATE>(selector?: Selector<STATE, T>, config?: {
        withSuspense?: boolean | ((subState: any) => boolean);
        eq?: IsEqual<T>;
    }) => T;
    fetch: SIF;
};
```
<b>References:</b> [Selector](./rd-model.selector.md)
