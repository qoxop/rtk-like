import React from 'react';
import { Store } from 'redux';

import { isFunction } from '../utils/is-type';
import { isPending, outPromise } from '../utils/async';
import { ReduxContext, PageActionContext } from './context';
import {
  DefaultRootState, FunctionLike, IsEqual, Klass, Selector,
} from '../typings';
import { $classHooks, Controller, ReduxController } from '../helper/controller';
import {
  PageAction,
  getCurrentPageAction,
  getPageKey,
  getPageState,
  setPageState,
} from '../utils/history';

const {
  useRef,
  useMemo,
  useEffect,
  useState,
  useContext,
  useReducer,
  useLayoutEffect,
} = React;

type UseSelectorOptions<P> = {
  eq?: IsEqual<P>,
  useThrow?: boolean | FunctionLike<[P], boolean>;
}

// TODO： 移动到 utils 中
/**
 *  浅对比
 * @param last
 * @param cur
 * @returns
 */
const defEq = <T>(last: T, cur: T) => {
  if (last === cur) return true;
  if (cur && last && typeof cur === 'object' && typeof last === 'object') {
    const curKeys = Object.keys(cur);
    return curKeys.every((k) => cur[k] === last[k]) && curKeys.length === Object.keys(last).length;
  }
  return false;
};

/**
 * 获取 Redux 的 Dispatch 方法
 * @returns
 */
const useDispatch = () => (useContext(ReduxContext).store.dispatch);

/**
 * 订阅 Redux 的状态变化
 * @param selector
 * @param options
 * @returns
 */
const useSelector = <S = DefaultRootState, P = any>(
  selector: Selector<S, P>,
  options: UseSelectorOptions<P> = {},
) => {
  const { eq, useThrow: isThrow } = useMemo(() => ({
    eq: options.eq || defEq,
    // eslint-disable-next-line no-nested-ternary
    useThrow: options.useThrow === true
      ? isPending
      : (isFunction(options.useThrow) ? options.useThrow : null),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), []);
  const { subscriber, store } = useContext(ReduxContext);
  const [forceTimes, forceRender] = useReducer((s) => s + 1, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const subState = useMemo(() => selector(store.getState()), [store, forceTimes]);
  const subStateRef = useRef<P>(subState);

  // 添加订阅
  useLayoutEffect(() => {
    const symbolKey = Symbol('use-selector');
    const _newSubState = selector(store.getState());
    if (!eq(_newSubState, subStateRef.current)) {
      Promise.resolve().then(forceRender);
      subStateRef.current = _newSubState;
    }
    subscriber.add(symbolKey, (appState) => {
      const newSubState = selector(appState);
      if (!eq(newSubState, subStateRef.current)) {
        subStateRef.current = newSubState;
        forceRender();
      }
    });
    return () => subscriber.remove(symbolKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  if (isThrow) {
    // 判断是否为 pending，如果是 pending 抛出一个 promise 的异常
    if (isThrow(subState)) {
      const { promise, resolve } = outPromise<P>();
      const symbolKey = Symbol('use-throw');
      subscriber.add(symbolKey, (appState) => {
        const newSubState = selector(appState);
        if (!isThrow(newSubState)) {
          resolve(newSubState);
          return true;
        }
      }, /* only once */ true);
      throw promise;
    }
  }
  return subState;
};

/**
 * 使用一个 Controller 类
 * @param CtrlClass
 * @param props
 * @returns
 */
const useController = <C extends Controller, P = any>(CtrlClass: Klass<[P?], C>, props?: P):[C, ReturnType<C['useHooks']>] => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ctrl = useMemo(() => (new CtrlClass(props)), []);
  ctrl[$classHooks](props);
  const data = ctrl.useHooks();
  return [ctrl, data];
};

/**
 * 使用一个 ReduxController 类
 * @param CtrlClass
 * @param props
 * @returns
 */
const useReduxController = <C extends ReduxController, P = any>(CtrlClass: Klass<[Store, P?], C>, props?: P): [C, ReturnType<C['useHooks']>] => {
  const { store } = useContext(ReduxContext);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ctrl = useMemo(() => (new CtrlClass(store, props)), []);
  ctrl[$classHooks](props);
  const data = ctrl.useHooks();
  return [ctrl, data];
};

const useCtrlContext = <C extends Klass & { Context: any } = any>(CtrlClass: C) => (
  useContext<InstanceType<C>>(CtrlClass.Context)
);

const usePropRef = <P>(prop: P) => {
  const propRef = useRef(prop);
  if (propRef.current !== prop) {
    propRef.current = prop;
  }
  return propRef;
};

const useStateRef = <T>(init: T|(() => T)) => {
  const [state, setState] = useState(init);
  const stateRef = usePropRef(state);
  return [state, setState, stateRef] as const;
};

/**
 * 订阅页面钩子
 * @param options
 */
const usePageEffect = (options: {
  onEnter?: FunctionLike<[PageAction], void>;
  onLeave?: FunctionLike<[PageAction], void>;
  onEnterEffect?: FunctionLike<[PageAction], void>;
}) => {
  const curOptions = usePropRef(options);
  const executed = useRef(false);
  const action = useContext(PageActionContext);

  if (!executed.current) {
    executed.current = true;
    if (isFunction(curOptions.current.onEnter)) {
      curOptions.current.onEnter(action);
    }
  }

  useEffect(() => {
    if (isFunction(curOptions.current.onEnterEffect)) {
      curOptions.current.onEnterEffect(action);
    }
    const { onLeave } = curOptions.current
    return () => {
      if (isFunction(onLeave)) {
        Promise.resolve().then(() => {
          try {
            onLeave(getCurrentPageAction());
          } catch (error) {
            console.warn(error)
          }
        });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};

/**
 * 查询和设置页面状态数据
 * @param init
 * @returns
 */
const usePageState = <T>(init: T | (() => T), suffix = '') => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pageKey = useMemo(() => `${getPageKey()}${suffix}`, []);
  const [state, setState, stateRef] = useStateRef(() => getPageState(init, pageKey));
  // 组件销毁时保存
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => () => setPageState(stateRef.current, pageKey), [stateRef]);
  return [state, setState];
};

export {
  usePropRef,
  useStateRef,
  useDispatch,
  useSelector,
  useController,
  useReduxController,
  useCtrlContext,
  usePageState,
  usePageEffect,
};

export type {
  UseSelectorOptions,
};