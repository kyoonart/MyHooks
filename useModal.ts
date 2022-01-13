import React, { useCallback, useEffect, useState, useRef, useMemo } from 'react';
import { Provider } from 'react-redux';
import ReactDOM from 'react-dom';
import store from '@src/store';

const closeModalFns: Array<() => void> = [];

export function closeAllModal() {
  closeModalFns.forEach(close => close());
  closeModalFns.length = 0;
}

type PartialModalProps<T> = Partial<Omit<T, 'visible'>>;

function useModal<
  T extends { visible: boolean; onOk?: () => void; onCancel?: () => void; afterClose?: () => void }
>(Modal: React.ComponentClass<T> | React.FunctionComponent<T>, props?: PartialModalProps<T>) {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);
  const [openProps, setOpenProps] = useState<PartialModalProps<T>>({});
  const open = useCallback((newOpenProps?: PartialModalProps<T>) => {
    newOpenProps && setOpenProps(newOpenProps);
    setVisible(true);
    setClosed(false);
  }, []);
  const close = useCallback(() => setVisible(false), []);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const modalProps = useMemo(() => {
    const modalProps = {
      ...props,
      ...openProps
    };
    return {
      ...modalProps,
      visible,
      onOk() {
        setVisible(false);
        if (modalProps.onOk) {
          modalProps.onOk();
        }
      },
      onCancel() {
        setVisible(false);
        if (modalProps.onCancel) {
          modalProps.onCancel();
        }
      },
      afterClose() {
        setClosed(true);
        setOpenProps({});
        if (modalProps.afterClose) {
          modalProps.afterClose();
        }
      }
    };
  }, [props, visible, openProps]) as T;
  const unmount = useCallback(() => {
    if (containerRef.current) {
      ReactDOM.unmountComponentAtNode(containerRef.current);
      document.body.removeChild(containerRef.current);
      containerRef.current = null;
    }
  }, []);

  // 初始化挂载节点
  useEffect(() => {
    if (visible && !containerRef.current) {
      containerRef.current = document.createElement('div');
      document.body.appendChild(containerRef.current);
    }
  }, [visible]);

  // 初始化/更新Modal组件
  useEffect(() => {
    if (containerRef.current) {
      ReactDOM.render(
        React.createElement(Provider, { store }, React.createElement(Modal, modalProps)),
        containerRef.current
      );
    }
  }, [modalProps, Modal]);

  // 关闭之后卸载掉dom
  useEffect(() => {
    if (closed) {
      unmount();
    }
  }, [closed, unmount]);

  // 保存关闭函数，方便调用
  useEffect(() => {
    closeModalFns.push(close);
    return () => {
      const idx = closeModalFns.indexOf(close);
      if (idx >= 0) {
        closeModalFns.splice(idx, 1);
      }
    };
  }, [close]);

  // 组件卸载时也卸载掉打开的modal
  useEffect(() => {
    return () => {
      unmount();
    };
  }, [unmount]);

  return [open, close];
}

export default useModal;
