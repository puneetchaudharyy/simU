import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AxiosError } from 'axios';
import * as monitorsApi from '../api/monitors';
import type { ApiError } from '../types/auth';
import type { Monitor } from '../types/monitor';
import { StatusBadge } from '../components/StatusBadge';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loadMonitors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setMonitors(await monitorsApi.listMonitors());
    } catch {
      setError('Could not load monitors. Check that the API is running.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMonitors();
  }, [loadMonitors]);

  async function handleToggleActive(monitor: Monitor) {
    setPendingId(monitor.id);
    setError(null);
    try {
      const updated = await monitorsApi.updateMonitor(monitor.id, { active: !monitor.active });
      setMonitors((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err) {
      setError(extractMessage(err, `Couldn't update "${monitor.name}". Try again.`));
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(monitor: Monitor) {
    if (!window.confirm(`Delete "${monitor.name}"? This can't be undone.`)) {
      return;
    }
    setPendingId(monitor.id);
    setError(null);
    try {
      await monitorsApi.deleteMonitor(monitor.id);
      setMonitors((prev) => prev.filter((m) => m.id !== monitor.id));
    } catch (err) {
      setError(extractMessage(err, `Couldn't delete "${monitor.name}". Try again.`));
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Monitors</h1>
          <p className={styles.subtitle}>
            {monitors.length} watched {monitors.length === 1 ? 'endpoint' : 'endpoints'}
          </p>
        </div>
        <Link to="/monitors/new" className={styles.newButton}>
          + Add monitor
        </Link>
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {isLoading ? (
        <p className={styles.loading}>Loading monitors…</p>
      ) : monitors.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>Nothing being watched yet.</p>
          <Link to="/monitors/new" className={styles.newButton}>
            + Add your first monitor
          </Link>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Status</th>
              <th>Name</th>
              <th>URL</th>
              <th>Method</th>
              <th>Interval</th>
              <th aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {monitors.map((monitor) => (
              <tr key={monitor.id}>
                <td>
                  <StatusBadge active={monitor.active} />
                </td>
                <td className={styles.name}>{monitor.name}</td>
                <td className={styles.url}>{monitor.url}</td>
                <td className={styles.mono}>{monitor.method}</td>
                <td className={styles.mono}>{monitor.checkIntervalSec}s</td>
                <td className={styles.actions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => void handleToggleActive(monitor)}
                    disabled={pendingId === monitor.id}
                  >
                    {monitor.active ? 'Pause' : 'Resume'}
                  </button>
                  <Link className={styles.actionButton} to={`/monitors/${monitor.id}/edit`}>
                    Edit
                  </Link>
                  <button
                    className={styles.actionButtonDanger}
                    onClick={() => void handleDelete(monitor)}
                    disabled={pendingId === monitor.id}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function extractMessage(err: unknown, fallback: string): string {
  const axiosErr = err as AxiosError<ApiError>;
  return axiosErr.response?.data?.message ?? fallback;
}
