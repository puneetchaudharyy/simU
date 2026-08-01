import styles from './StatusBadge.module.css';

interface StatusBadgeProps {
  active: boolean;
}

export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <span className={active ? styles.up : styles.paused}>
      <span className={styles.dot} aria-hidden="true" />
      {active ? 'Active' : 'Paused'}
    </span>
  );
}
