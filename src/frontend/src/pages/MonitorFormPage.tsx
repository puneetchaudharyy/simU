import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { AxiosError } from 'axios';
import * as monitorsApi from '../api/monitors';
import type { ApiError } from '../types/auth';
import type { HttpMethod } from '../types/monitor';
import styles from './MonitorFormPage.module.css';

const METHODS: HttpMethod[] = ['GET', 'POST', 'HEAD', 'PUT'];

export function MonitorFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<HttpMethod>('GET');
  const [expectedStatusCode, setExpectedStatusCode] = useState(200);
  const [checkIntervalSec, setCheckIntervalSec] = useState(60);
  const [timeoutMs, setTimeoutMs] = useState(5000);

  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    monitorsApi
      .getMonitor(id)
      .then((monitor) => {
        setName(monitor.name);
        setUrl(monitor.url);
        setMethod(monitor.method);
        setExpectedStatusCode(monitor.expectedStatusCode);
        setCheckIntervalSec(monitor.checkIntervalSec);
        setTimeoutMs(monitor.timeoutMs);
      })
      .catch(() => setError('Could not load this monitor.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = { name, url, method, expectedStatusCode, checkIntervalSec, timeoutMs };

    try {
      if (id) {
        await monitorsApi.updateMonitor(id, payload);
      } else {
        await monitorsApi.createMonitor(payload);
      }
      navigate('/', { replace: true });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const fieldErrors = axiosErr.response?.data?.fieldErrors;
      const firstFieldError = fieldErrors ? Object.values(fieldErrors)[0] : undefined;
      setError(firstFieldError ?? axiosErr.response?.data?.message ?? 'Could not save this monitor. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <p className={styles.loading}>Loading…</p>;
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>{isEditing ? 'Edit monitor' : 'Add monitor'}</h1>

      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <label className={styles.field}>
          <span className={styles.label}>Name</span>
          <input
            className={styles.input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>URL</span>
          <input
            className={styles.inputMono}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/health"
            required
          />
        </label>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Method</span>
            <select className={styles.input} value={method} onChange={(e) => setMethod(e.target.value as HttpMethod)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Expected status</span>
            <input
              className={styles.inputMono}
              type="number"
              min={100}
              max={599}
              value={expectedStatusCode}
              onChange={(e) => setExpectedStatusCode(Number(e.target.value))}
              required
            />
          </label>
        </div>

        <div className={styles.row}>
          <label className={styles.field}>
            <span className={styles.label}>Check interval (sec)</span>
            <input
              className={styles.inputMono}
              type="number"
              min={10}
              max={86400}
              value={checkIntervalSec}
              onChange={(e) => setCheckIntervalSec(Number(e.target.value))}
              required
            />
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Timeout (ms)</span>
            <input
              className={styles.inputMono}
              type="number"
              min={1000}
              max={60000}
              value={timeoutMs}
              onChange={(e) => setTimeoutMs(Number(e.target.value))}
              required
            />
          </label>
        </div>

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        <div className={styles.actions}>
          <button type="button" className={styles.cancel} onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : isEditing ? 'Save changes' : 'Add monitor'}
          </button>
        </div>
      </form>
    </div>
  );
}
