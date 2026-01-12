import { useState } from 'react';
import { api } from '../api/axios';
import './AuthBar.css';

type Mode = 'login' | 'register';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: 'teacher' | 'student';
}

interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

interface AuthBarProps {
  onAuthChange(user: AuthUser | null): void;
  currentUser: AuthUser | null;
}

function formatShortName(fullName?: string) {
  if (!fullName) return '';
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const [first, ...rest] = parts;
  const last = rest.pop() ?? '';
  return `${first} ${last.charAt(0).toUpperCase()}.`;
}

export function AuthBar({ currentUser, onAuthChange }: AuthBarProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'teacher' | 'student'>('student');
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setFirstName('');
    setLastName('');
    setPassword('');
    setRole('student');
    setError(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    onAuthChange(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'login'
          ? { email, password }
          : { email, firstName, lastName, password, role };

      const { data } = await api.post<AuthResponse>(endpoint, payload);
      localStorage.setItem('accessToken', data.accessToken);
      onAuthChange(data.user);
      setIsOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      setError('Не удалось выполнить запрос. Проверь данные и попробуй ещё раз.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-bar">
      {!currentUser ? (
        <>
          <button
            type="button"
            className="link-like"
            onClick={() => {
              setMode('login');
              setIsOpen(true);
            }}
          >
            Войти
          </button>
          <button
            type="button"
            className="link-like secondary"
            onClick={() => {
              setMode('register');
              setIsOpen(true);
            }}
          >
            Регистрация
          </button>
        </>
      ) : (
        <div className="auth-user">
          <span className="user-name">{formatShortName(currentUser.name)}</span>
          <button type="button" className="link-like secondary" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      )}

      {isOpen && !currentUser && (
        <div className="auth-modal">
          <div className="auth-modal-card">
            <div className="auth-modal-header">
              <h3>{mode === 'login' ? 'Вход' : 'Регистрация'}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
              >
                ✕
              </button>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              {mode === 'register' && (
                <>
                  <label>
                    Имя
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Фамилия
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Роль
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'teacher' | 'student')}
                      required
                    >
                      <option value="student">Студент</option>
                      <option value="teacher">Преподаватель</option>
                    </select>
                  </label>
                </>
              )}

              <label>
                Пароль
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </label>

              {error && <p className="auth-error">{error}</p>}

              <button type="submit" className="primary" disabled={isLoading}>
                {isLoading
                  ? 'Отправляем...'
                  : mode === 'login'
                    ? 'Войти'
                    : 'Зарегистрироваться'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


