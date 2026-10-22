import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Scene } from '../fx/ambient/Scene';
import { t } from '../strings';
import { signIn } from '../sync/cloud';
import { rememberGuestChoice } from '../sync/localCache';
import { HomeButton } from '../ui/HomeButton';
import './Login.css';

// For the parent, once per device: the family account keeps his progress on every device.
// Playing without it is always fine (progress stays on this device and joins the account later).
export function LoginScreen() {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'busy' | 'wrong' | 'offline'>('idle');

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!login.trim() || !password || state === 'busy') return;
    setState('busy');
    const result = await signIn(login, password);
    if (result === 'ok') navigate('/map', { replace: true });
    else setState(result);
  }

  return (
    <main className="screen login-screen">
      <Scene quiet />
      <nav className="screen-nav">
        <HomeButton />
      </nav>
      <form className="login-card parchment" onSubmit={(e) => void submit(e)}>
        <h1 className="login-title">{t.login.title}</h1>
        <p className="login-hint">{t.login.hint}</p>
        <label className="login-field">
          <span>{t.login.login}</span>
          <input value={login} onChange={(e) => setLogin(e.target.value)} autoComplete="username" autoCapitalize="none" spellCheck={false} required />
        </label>
        <label className="login-field">
          <span>{t.login.password}</span>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        </label>
        {(state === 'wrong' || state === 'offline') && (
          <p className="login-error" role="alert">
            {t.login[state]}
          </p>
        )}
        <div className="login-actions">
          <button type="submit" className="login-submit" disabled={state === 'busy'}>
            {state === 'busy' ? t.login.busy : t.login.submit}
          </button>
          <button
            type="button"
            className="login-guest"
            onClick={() => {
              rememberGuestChoice();
              navigate('/map', { replace: true });
            }}
          >
            {t.login.guest}
          </button>
        </div>
      </form>
    </main>
  );
}
