import React from 'react';
import { isFunction } from '../utils/is-type';
import { PageAction, getCurrentPageAction } from '../utils/history';
import { FunctionLike } from '../typings';

const {
  useState,
  useEffect,
} = React;

/**
 * 增强路由组件，增加前进后退钩子
 * @param Component
 * @param opt
 * @returns
 */
function withPageHook<T = FunctionLike<[any], any>>(
  Component: T,
  opt: {
    onEnter?: FunctionLike<[PageAction?], void>;
    onLeave?: FunctionLike<[PageAction?], void>;
  },
): T {
  const { onEnter, onLeave } = opt;
  const WithHookComponent:React.FC = (props) => {
    const [canRender, setCanRender] = useState(false);
    useEffect(() => { 
      // 延后渲染, 确保相关工作执行完毕
      Promise.resolve().then(() => setCanRender(true));
      if (isFunction(onEnter)) {
        onEnter(getCurrentPageAction());
      }
      return () => {
        Promise.resolve().then(() => {
          if (isFunction(onLeave)) {
            onLeave(getCurrentPageAction());
          }
        });
      }
    }, []);
    if (canRender) {
      // @ts-ignore
      return <Component {...props} />;
    }
    return null;
  };
  return WithHookComponent as unknown as T;
}

export {
  withPageHook,
};
