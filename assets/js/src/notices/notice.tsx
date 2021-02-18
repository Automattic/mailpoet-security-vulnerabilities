import React, { ReactNode } from 'react';
import ReactDOM from 'react-dom';
import MailPoet from 'mailpoet';

type Props = {
  type: 'success' | 'info' | 'warning' | 'error';
  children: ReactNode;
  scroll?: boolean;
  closable?: boolean;
  renderInPlace?: boolean;
  onDisplay?: () => void;
  onClose?: () => void;
  timeout?: number | false;
};

const Notice = ({
  onClose,
  onDisplay,
  renderInPlace,
  timeout,
  scroll,
  children,
  closable,
  type,
}: Props) => {
  const [hidden, setHidden] = React.useState(false);
  const elementRef = React.useRef(null);
  const timeoutRef = React.useRef(null);

  const close = React.useCallback(() => {
    if (onClose) onClose();
    setHidden(true);
  }, [onClose]);

  React.useEffect(() => {
    if (timeout) {
      timeoutRef.current = setTimeout(close, timeout);
    }
    return () => (timeoutRef.current ? clearTimeout(timeoutRef.current) : null);
  }, [close, timeout]);

  React.useLayoutEffect(() => {
    if (scroll && elementRef.current) {
      elementRef.current.scrollIntoView(false);
    }
  }, [scroll]);

  React.useLayoutEffect(() => {
    if (onDisplay) onDisplay();
  }, [onDisplay]);

  if (hidden) return null;

  const content = (
    <div ref={elementRef} className={`notice ${type} ${closable ? 'is-dismissible' : ''}`}>
      {children}
      {closable && (
        <button type="button" className="notice-dismiss" onClick={close}>
          <span className="screen-reader-text">{MailPoet.I18n.t('dismissNotice')}</span>
        </button>
      )}
    </div>
  );

  if (renderInPlace) {
    return content;
  }

  return ReactDOM.createPortal(
    content,
    document.getElementById('mailpoet_notices')
  );
};
Notice.defaultProps = {
  timeout: 10000,
  scroll: false,
  closable: true,
  renderInPlace: false,
  onDisplay: undefined,
  onClose: undefined,
};

export default Notice;
