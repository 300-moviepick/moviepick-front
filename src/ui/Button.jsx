import { Link } from 'react-router-dom';
import styles from './Button.module.css';

function classes(...names) {
  return names.filter(Boolean).join(' ');
}

/**
 * variant: primary | secondary | danger | ghost | soft
 * size: sm | md | lg
 * to(내부 이동) 또는 href(외부 이동)가 있으면 링크로 렌더링한다.
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  block = false,
  icon,
  iconRight,
  to,
  href,
  type = 'button',
  className,
  children,
  ...rest
}) {
  const cls = classes(styles.btn, styles[variant], styles[size], block && styles.block, className);
  const content = (
    <>
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : icon}
      {children && <span>{children}</span>}
      {!loading && iconRight}
    </>
  );

  if (to && !disabled) {
    return (
      <Link to={to} className={cls} {...rest}>
        {content}
      </Link>
    );
  }
  if (href && !disabled) {
    return (
      <a href={href} className={cls} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <button type={type} className={cls} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {content}
    </button>
  );
}

// 원형 아이콘 버튼. label은 화면 읽기 프로그램용 이름(필수).
export function IconButton({ label, size = 'md', variant = 'plain', className, children, type = 'button', ...rest }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={classes(styles.iconBtn, styles[`icon_${size}`], styles[`icon_${variant}`], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
