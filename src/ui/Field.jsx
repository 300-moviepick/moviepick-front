import { useId } from 'react';
import styles from './Field.module.css';

// 라벨·도움말·오류·글자 수를 함께 그리는 입력 묶음
function FieldShell({ id, label, required, hint, error, count, max, aside, children }) {
  return (
    <div className={styles.field}>
      {(label || aside) && (
        <div className={styles.labelRow}>
          {label && (
            <label htmlFor={id} className={styles.label}>
              {label}
              {required && <span className={styles.required}> *</span>}
            </label>
          )}
          {aside && <span className={styles.aside}>{aside}</span>}
        </div>
      )}
      {children}
      {(error || hint || max) && (
        <div className={styles.footRow}>
          {error ? (
            <p id={`${id}-msg`} className={styles.error} role="alert">
              {error}
            </p>
          ) : (
            hint && (
              <p id={`${id}-msg`} className={styles.hint}>
                {hint}
              </p>
            )
          )}
          {max && (
            <span className={styles.count}>
              {count ?? 0} / {max}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function TextField({ label, required, hint, error, aside, icon, trailing, showCount, className = '', ...input }) {
  const autoId = useId();
  const id = input.id || autoId;
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      aside={aside}
      count={showCount ? String(input.value ?? '').length : undefined}
      max={showCount ? input.maxLength : undefined}
    >
      <div className={`${styles.control} ${error ? styles.invalid : ''} ${className}`}>
        {icon && <span className={styles.icon}>{icon}</span>}
        <input
          id={id}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          required={required}
          {...input}
        />
        {trailing}
      </div>
    </FieldShell>
  );
}

export function TextArea({ label, required, hint, error, aside, showCount, rows = 5, ...input }) {
  const autoId = useId();
  const id = input.id || autoId;
  return (
    <FieldShell
      id={id}
      label={label}
      required={required}
      hint={hint}
      error={error}
      aside={aside}
      count={showCount ? String(input.value ?? '').length : undefined}
      max={showCount ? input.maxLength : undefined}
    >
      <div className={`${styles.control} ${styles.areaControl} ${error ? styles.invalid : ''}`}>
        <textarea
          id={id}
          rows={rows}
          className={styles.textarea}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? `${id}-msg` : undefined}
          required={required}
          {...input}
        />
      </div>
    </FieldShell>
  );
}

export function Select({ label, hint, error, options = [], ...select }) {
  const autoId = useId();
  const id = select.id || autoId;
  return (
    <FieldShell id={id} label={label} hint={hint} error={error}>
      <div className={`${styles.control} ${error ? styles.invalid : ''}`}>
        <select id={id} className={styles.select} {...select}>
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </FieldShell>
  );
}

export function Checkbox({ label, description, ...input }) {
  return (
    <label className={styles.check}>
      <input type="checkbox" className={styles.checkInput} {...input} />
      <span className={styles.checkBox} aria-hidden="true" />
      <span className={styles.checkText}>
        <span>{label}</span>
        {description && <span className={styles.hint}>{description}</span>}
      </span>
    </label>
  );
}

// 켜기/끄기 스위치. 체크박스를 role=switch로 사용한다.
export function Toggle({ label, description, ...input }) {
  return (
    <label className={styles.toggle}>
      <span className={styles.checkText}>
        <span className={styles.toggleLabel}>{label}</span>
        {description && <span className={styles.hint}>{description}</span>}
      </span>
      <input type="checkbox" role="switch" className={styles.checkInput} {...input} />
      <span className={styles.track} aria-hidden="true">
        <span className={styles.thumb} />
      </span>
    </label>
  );
}
