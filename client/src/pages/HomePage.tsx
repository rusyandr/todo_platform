import '../App.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Tasks } from '../components/Tasks';
import { SubjectsPanel, type SubjectCard } from '../components/SubjectsPanel';
import { TeamsPanel, type TeamCard } from '../components/TeamsPanel';
import { TeamDetails } from '../components/TeamDetails';
import { AuthBar, type AuthUser } from '../components/AuthBar';
import { api } from '../api/axios';
import {
  getTeamDetails,
  createTeamTask,
  updateTaskStatus,
  type TeamDetailsResponse,
} from '../api/teams';

type ApiTeam = {
  id: number;
  name: string;
  deadline: string | null;
  joinCode: string;
  admin: { id: number; name: string | null } | null;
  subject: { id: number; title: string };
  members?: { id: number }[];
};

type ApiTeamMembership = {
  id: number;
  role: 'admin' | 'member';
  team: ApiTeam;
};

type ApiSubject = {
  id: number;
  title: string;
  description: string | null;
  joinCode?: string | null;
  deadline?: string | null;
  createdBy?: { id: number; name: string | null };
  teams?: ApiTeam[];
};

const focusItems = [
  'Проверь статус зависимых задач перед отметкой готовности.',
  'Назначь ответственных за новые исследования по предмету ИПО.',
  'Запланируй ревью файлов до пятницы.',
];

export function HomePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [subjects, setSubjects] = useState<SubjectCard[]>([]);
  const [subjectEntities, setSubjectEntities] = useState<ApiSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCard | null>(null);
  const [isCopyingCode, setIsCopyingCode] = useState(false);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamsError, setTeamsError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [teamDetails, setTeamDetails] = useState<TeamDetailsResponse | null>(null);
  const [teamDetailsLoading, setTeamDetailsLoading] = useState(false);
  const [teamDetailsError, setTeamDetailsError] = useState<string | null>(null);

  const [notice, setNotice] = useState<{ text: string; tone: 'info' | 'error' } | null>(null);

  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ title: '', description: '', deadline: '' });
  const [subjectModalError, setSubjectModalError] = useState<string | null>(null);
  const [isSubjectSubmitting, setIsSubjectSubmitting] = useState(false);

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ subjectId: '', name: '', deadline: '' });
  const [teamModalError, setTeamModalError] = useState<string | null>(null);
  const [isTeamSubmitting, setIsTeamSubmitting] = useState(false);

  const [isTeamJoinModalOpen, setIsTeamJoinModalOpen] = useState(false);
  const [teamJoinCode, setTeamJoinCode] = useState('');
  const [teamJoinModalError, setTeamJoinModalError] = useState<string | null>(null);
  const [isTeamJoinSubmitting, setIsTeamJoinSubmitting] = useState(false);

  const [isSubjectJoinModalOpen, setIsSubjectJoinModalOpen] = useState(false);
  const [subjectJoinCode, setSubjectJoinCode] = useState('');
  const [subjectJoinModalError, setSubjectJoinModalError] = useState<string | null>(null);
  const [isSubjectJoinSubmitting, setIsSubjectJoinSubmitting] = useState(false);

  const showNotice = useCallback((text: string, tone: 'info' | 'error' = 'info') => {
    setNotice({ text, tone });
  }, []);

  const clearModals = () => {
    setSubjectForm({ title: '', description: '', deadline: '' });
    setTeamForm({ subjectId: '', name: '', deadline: '' });
    setSubjectModalError(null);
    setTeamModalError(null);
    setTeamJoinCode('');
    setTeamJoinModalError(null);
    setSubjectJoinCode('');
    setSubjectJoinModalError(null);
  };

  const loadSubjects = useCallback(async () => {
    if (!currentUser) {
      return;
    }
    setSubjectsLoading(true);
    setSubjectsError(null);
    try {
      const { data } = await api.get<ApiSubject[]>('/subjects');
      setSubjectEntities(data);
      setSubjects(
        data.map((subject) => ({
          id: subject.id,
          title: subject.title,
          description: subject.description ?? 'Описание пока не добавлено',
          teamCount: subject.teams?.length ?? 0,
          deadlineLabel: formatSubjectDeadline(subject),
          joinCode: subject.joinCode ?? undefined,
          authorName: subject.createdBy?.name ?? '—',
        })),
      );
    } catch (error) {
      console.error(error);
      setSubjectsError('Не удалось загрузить предметы. Попробуй обновить страницу.');
      setSubjectEntities([]);
      setSubjects([]);
    } finally {
      setSubjectsLoading(false);
    }
  }, [currentUser]);

  const loadTeams = useCallback(async () => {
    if (!currentUser) {
      return;
    }
    setTeamsLoading(true);
    setTeamsError(null);
    try {
      const { data } = await api.get<ApiTeamMembership[]>('/teams/mine');
      setTeams(mapTeams(data));
    } catch (error) {
      console.error(error);
      setTeams([]);
      setTeamsError('Не удалось получить команды. Попробуй ещё раз.');
    } finally {
      setTeamsLoading(false);
    }
  }, [currentUser]);

  const fetchTeamDetails = useCallback(
    async (teamId: number | null) => {
      if (!currentUser || !teamId) {
        setTeamDetails(null);
        return;
      }
      setTeamDetailsLoading(true);
      setTeamDetailsError(null);
      try {
        const { data } = await getTeamDetails(teamId);
        setTeamDetails(data);
      } catch (error) {
        console.error(error);
        setTeamDetailsError('Не удалось загрузить команду');
      } finally {
        setTeamDetailsLoading(false);
      }
    },
    [currentUser],
  );

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      return;
    }

    api
      .get<{ userId: number; email: string; role: 'host' | 'student'; name: string }>('/auth/me')
      .then(async (res) => {
        const user = {
          id: res.data.userId,
          email: res.data.email,
          name: res.data.name,
          role: res.data.role,
        } as AuthUser;
        setCurrentUser(user);

        setTeamsLoading(true);
        try {
          const teamsRes = await api.get<ApiTeamMembership[]>('/teams/mine');
          setTeams(mapTeams(teamsRes.data));
        } catch (err) {
          console.error('Failed to load teams during auth restore', err);
          setTeams([]);
        } finally {
          setTeamsLoading(false);
        }

        setSubjectsLoading(true);
        try {
          const subjectsRes = await api.get<ApiSubject[]>('/subjects');
          setSubjectEntities(subjectsRes.data);
          setSubjects(
            subjectsRes.data.map((subject) => ({
              id: subject.id,
              title: subject.title,
              description: subject.description ?? 'Описание пока не добавлено',
              teamCount: subject.teams?.length ?? 0,
              deadlineLabel: formatSubjectDeadline(subject),
              joinCode: subject.joinCode ?? undefined,
              authorName: subject.createdBy?.name ?? '—',
            })),
          );
        } catch (err) {
          console.error('Failed to load subjects during auth restore', err);
        } finally {
          setSubjectsLoading(false);
        }
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        setCurrentUser(null);
      });
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setSubjects([]);
      setSubjectEntities([]);
      setTeams([]);
      setSelectedTeamId(null);
      setTeamDetails(null);
      return;
    }
    loadSubjects();
    loadTeams();
  }, [currentUser, loadSubjects, loadTeams]);

  useEffect(() => {
    fetchTeamDetails(selectedTeamId);
  }, [selectedTeamId, fetchTeamDetails]);

  const handleOpenSubjectModal = () => {
    if (!currentUser) {
      showNotice('Войдите в систему, чтобы создать предмет.', 'error');
      return;
    }
    if (currentUser.role !== 'host') {
      showNotice('Предметы может создавать только хост (преподаватель).', 'error');
      return;
    }
    setSubjectModalError(null);
    setIsSubjectModalOpen(true);
  };

  const handleSubjectSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      setSubjectModalError('Сначала авторизуйся.');
      return;
    }
    if (currentUser.role !== 'host') {
      setSubjectModalError('Создавать предметы может только хост.');
      return;
    }
    if (!subjectForm.title.trim()) {
      setSubjectModalError('Название обязательно.');
      return;
    }

    setIsSubjectSubmitting(true);
    setSubjectModalError(null);
    try {
      await api.post('/subjects', {
        title: subjectForm.title,
        description: subjectForm.description || undefined,
        deadline: subjectForm.deadline ? new Date(subjectForm.deadline).toISOString() : undefined,
      });
      showNotice('Предмет создан.', 'info');
      setIsSubjectModalOpen(false);
      clearModals();
      await Promise.all([loadSubjects(), loadTeams()]);
    } catch (error) {
      console.error(error);
      setSubjectModalError('Не удалось создать предмет. Попробуй ещё раз.');
    } finally {
      setIsSubjectSubmitting(false);
    }
  };

  const handleOpenTeamModal = () => {
    if (!currentUser) {
      showNotice('Войдите, чтобы управлять командами.', 'error');
      return;
    }
    if (!subjectEntities.length) {
      showNotice('Сначала нужен хотя бы один предмет.', 'error');
      return;
    }
    setTeamModalError(null);
    setIsTeamModalOpen(true);
  };

  const handleTeamSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      setTeamModalError('Сначала авторизуйся.');
      return;
    }
    if (!teamForm.subjectId) {
      setTeamModalError('Выбери предмет.');
      return;
    }
    if (!teamForm.name.trim()) {
      setTeamModalError('Название команды обязательно.');
      return;
    }

    setIsTeamSubmitting(true);
    setTeamModalError(null);
    try {
      await api.post('/teams', {
        subjectId: Number(teamForm.subjectId),
        name: teamForm.name,
        deadline: teamForm.deadline ? new Date(teamForm.deadline).toISOString() : undefined,
      });
      showNotice('Команда создана. Код приглашения уже доступен.', 'info');
      setIsTeamModalOpen(false);
      clearModals();
      await Promise.all([loadSubjects(), loadTeams()]);
    } catch (error) {
      console.error(error);
      setTeamModalError('Не удалось создать команду. Попробуй ещё раз.');
    } finally {
      setIsTeamSubmitting(false);
    }
  };

  const handleOpenTeamJoinModal = () => {
    if (!currentUser) {
      showNotice('Сначала войди или зарегистрируйся, чтобы присоединиться.', 'error');
      return;
    }
    setTeamJoinCode('');
    setTeamJoinModalError(null);
    setIsTeamJoinModalOpen(true);
  };

  const handleSelectTeam = (teamJoinCode: string) => {
    navigate(`/team/${teamJoinCode}`);
  };

  const handleTeamJoinSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      setTeamJoinModalError('Сначала авторизуйся.');
      return;
    }
    if (!teamJoinCode.trim()) {
      setTeamJoinModalError('Введите код команды.');
      return;
    }

    setIsTeamJoinSubmitting(true);
    setTeamJoinModalError(null);
    try {
      await api.post('/teams/join', { joinCode: teamJoinCode.trim().toUpperCase() });
      showNotice('Ты присоединился к команде.', 'info');
      setIsTeamJoinModalOpen(false);
      setTeamJoinCode('');
      await Promise.all([loadTeams(), loadSubjects()]);
    } catch (error) {
      console.error(error);
      setTeamJoinModalError('Не удалось присоединиться. Проверь код и попробуй снова.');
    } finally {
      setIsTeamJoinSubmitting(false);
    }
  };

  const handleOpenSubjectJoinModal = () => {
    if (!currentUser) {
      showNotice('Сначала войди или зарегистрируйся, чтобы присоединиться к предмету.', 'error');
      return;
    }
    setSubjectJoinCode('');
    setSubjectJoinModalError(null);
    setIsSubjectJoinModalOpen(true);
  };

  const handleSubjectJoinSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) {
      setSubjectJoinModalError('Сначала авторизуйся.');
      return;
    }
    if (!subjectJoinCode.trim()) {
      setSubjectJoinModalError('Введите код предмета.');
      return;
    }

    setIsSubjectJoinSubmitting(true);
    setSubjectJoinModalError(null);
    try {
      await api.post('/subjects/join', { joinCode: subjectJoinCode.trim().toUpperCase() });
      showNotice('Ты добавлен на предмет.', 'info');
      setIsSubjectJoinModalOpen(false);
      setSubjectJoinCode('');
      await loadSubjects();
    } catch (error) {
      console.error(error);
      setSubjectJoinModalError('Не удалось присоединиться. Проверь код и попробуй снова.');
    } finally {
      setIsSubjectJoinSubmitting(false);
    }
  };

  const handleSelectSubject = (subject: SubjectCard) => {
    setSelectedSubject(subject);
    setCopySuccess(null);
    setIsCopyingCode(false);
  };

  const handleCopyJoinCode = async () => {
    if (!selectedSubject?.joinCode) {
      return;
    }
    try {
      setIsCopyingCode(true);
      await navigator.clipboard.writeText(selectedSubject.joinCode);
      setCopySuccess('Код скопирован');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error(error);
      setCopySuccess('Не удалось скопировать');
    } finally {
      setIsCopyingCode(false);
    }
  };

  async function handleCreateTeamTask(payload: {
    title: string;
    description?: string;
    assigneeIds: number[];
    deadline?: string;
    dependencyIds?: number[];
  }) {
    if (!selectedTeamId) {
      return;
    }
    await createTeamTask(selectedTeamId, payload);
    await fetchTeamDetails(selectedTeamId);
  }

  async function handleToggleTeamTask(taskId: number, isCompleted: boolean) {
    if (!selectedTeamId) {
      return;
    }
    await updateTaskStatus(selectedTeamId, taskId, isCompleted);
    await fetchTeamDetails(selectedTeamId);
  }

  const handleCloseTeamDetails = () => {
    setSelectedTeamId(null);
    setTeamDetails(null);
    setTeamDetailsError(null);
  };

  const heroSubtitle = useMemo(() => {
    if (!currentUser) {
      return 'Войди, чтобы видеть предметы, команды и задачи своего потока.';
    }
    if (currentUser.role === 'host') {
      return 'Создавай предметы, выдавай команды и отслеживай прогресс студентов.';
    }
    return 'Выбирай предмет, создавай команду и готовься к дедлайнам без хаоса.';
  }, [currentUser]);

  return (
    <div className="app-shell">
      <AuthBar currentUser={currentUser} onAuthChange={setCurrentUser} />
      <header className="app-hero">
        <p className="hero-badge">Общая платформа</p>
        <h1>Следи за предметами, командами и задачами в одном окне</h1>
        <p className="hero-subtitle">{heroSubtitle}</p>
        <div className="hero-actions">
          <button
            type="button"
            className="primary"
            onClick={
              currentUser && currentUser.role === 'host'
                ? handleOpenSubjectModal
                : handleOpenSubjectJoinModal
            }
            disabled={!currentUser}
          >
            {currentUser?.role === 'host' ? 'Создать предмет' : 'Ввести код предмета'}
          </button>
          <button type="button" className="ghost" onClick={handleOpenTeamModal} disabled={!currentUser}>
            Создать команду
          </button>
          <button
            type="button"
            className="ghost"
            onClick={handleOpenTeamJoinModal}
            disabled={!currentUser}
          >
            Ввести код команды
          </button>
        </div>
      </header>

      {notice && (
        <p className={`inline-message ${notice.tone === 'error' ? 'error' : ''}`}>
          {notice.text}
        </p>
      )}

      <main className="app-content">
        <section className="tiles-grid">
          <SubjectsPanel
            subjects={subjects}
            onAddSubject={handleOpenSubjectModal}
            onEnterCode={handleOpenSubjectJoinModal}
            onSelectSubject={handleSelectSubject}
            canCreate={Boolean(currentUser && currentUser.role === 'host')}
            canJoin={Boolean(currentUser && currentUser.role !== 'host')}
            actionDisabled={!currentUser || currentUser.role !== 'host'}
            isLoading={subjectsLoading}
            error={subjectsError}
          />
          <TeamsPanel
            teams={teams}
            onCreateTeam={handleOpenTeamModal}
            onEnterCode={handleOpenTeamJoinModal}
            disabled={!currentUser}
            isLoading={teamsLoading}
            error={teamsError}
            onSelectTeam={handleSelectTeam}
            activeTeamId={selectedTeamId}
          />
        </section>

        <section className="tasks-section">
          <div className="tasks-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Задачи платформы</p>
                <h2>Активные задачи</h2>
              </div>
              <button type="button" className="ghost small" disabled>
                Добавить задачу
              </button>
            </div>

            <Tasks />
          </div>

          <aside className="focus-card">
            <h3>Фокус недели</h3>
            <ul>
              {focusItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <button type="button" className="link-button" onClick={handleOpenTeamModal}>
              Открыть вкладку команды →
            </button>
          </aside>
        </section>
      </main>

      {selectedTeamId && (
        <div className="team-details-wrapper">
          {teamDetailsLoading && <p className="panel-placeholder">Загружаем команду…</p>}
          {teamDetailsError && <p className="panel-placeholder error">{teamDetailsError}</p>}
          {teamDetails && currentUser && (
            <TeamDetails
              team={teamDetails}
              currentUser={currentUser}
              onCreateTask={handleCreateTeamTask}
              onToggleTask={handleToggleTeamTask}
              onClose={handleCloseTeamDetails}
            />
          )}
        </div>
      )}

      {isSubjectModalOpen && (
        <div className="app-modal" role="dialog" aria-modal="true">
          <div className="app-modal-card">
            <h3>Новый предмет</h3>
            <form onSubmit={handleSubjectSubmit}>
              <label>
                Название
                <input
                  type="text"
                  value={subjectForm.title}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({ ...prev, title: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Описание
                <textarea
                  value={subjectForm.description}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  placeholder="О чём проект, формат сдачи, основные требования…"
                />
              </label>
              <label>
                Дедлайн предмета (необязательно)
                <input
                  type="date"
                  value={subjectForm.deadline}
                  onChange={(event) =>
                    setSubjectForm((prev) => ({ ...prev, deadline: event.target.value }))
                  }
                />
              </label>
              {subjectModalError && <p className="form-error">{subjectModalError}</p>}
              <div className="app-modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setIsSubjectModalOpen(false);
                    clearModals();
                  }}
                >
                  Отмена
                </button>
                <button type="submit" className="primary" disabled={isSubjectSubmitting}>
                  {isSubjectSubmitting ? 'Создаём…' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTeamModalOpen && (
        <div className="app-modal" role="dialog" aria-modal="true">
          <div className="app-modal-card">
            <h3>Новая команда</h3>
            <form onSubmit={handleTeamSubmit}>
              <label>
                Предмет
                <select
                  value={teamForm.subjectId}
                  onChange={(event) =>
                    setTeamForm((prev) => ({ ...prev, subjectId: event.target.value }))
                  }
                  required
                >
                  <option value="" disabled>
                    Выбери предмет
                  </option>
                  {subjectEntities.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.title}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Название команды
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(event) =>
                    setTeamForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </label>
              <label>
                Дедлайн (необязательно)
                <input
                  type="date"
                  value={teamForm.deadline}
                  onChange={(event) =>
                    setTeamForm((prev) => ({ ...prev, deadline: event.target.value }))
                  }
                />
              </label>
              {teamModalError && <p className="form-error">{teamModalError}</p>}
              <div className="app-modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setIsTeamModalOpen(false);
                    clearModals();
                  }}
                >
                  Отмена
                </button>
                <button type="submit" className="primary" disabled={isTeamSubmitting}>
                  {isTeamSubmitting ? 'Создаём…' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isTeamJoinModalOpen && (
        <div className="app-modal" role="dialog" aria-modal="true">
          <div className="app-modal-card">
            <h3>Войти по коду</h3>
            <form onSubmit={handleTeamJoinSubmit}>
              <label>
                Код команды
                <input
                  type="text"
                  value={teamJoinCode}
                  onChange={(event) => setTeamJoinCode(event.target.value.toUpperCase())}
                  placeholder="Например, ABC123"
                  required
                />
              </label>
              {teamJoinModalError && <p className="form-error">{teamJoinModalError}</p>}
              <div className="app-modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setIsTeamJoinModalOpen(false);
                    setTeamJoinCode('');
                  }}
                >
                  Отмена
                </button>
                <button type="submit" className="primary" disabled={isTeamJoinSubmitting}>
                  {isTeamJoinSubmitting ? 'Подключаем…' : 'Присоединиться'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSubjectJoinModalOpen && (
        <div className="app-modal" role="dialog" aria-modal="true">
          <div className="app-modal-card">
            <h3>Войти на предмет</h3>
            <form onSubmit={handleSubjectJoinSubmit}>
              <label>
                Код предмета
                <input
                  type="text"
                  value={subjectJoinCode}
                  onChange={(event) => setSubjectJoinCode(event.target.value.toUpperCase())}
                  placeholder="Например, ABC123"
                  required
                />
              </label>
              {subjectJoinModalError && <p className="form-error">{subjectJoinModalError}</p>}
              <div className="app-modal-actions">
                <button
                  type="button"
                  className="ghost"
                  onClick={() => {
                    setIsSubjectJoinModalOpen(false);
                    setSubjectJoinCode('');
                  }}
                >
                  Отмена
                </button>
                <button type="submit" className="primary" disabled={isSubjectJoinSubmitting}>
                  {isSubjectJoinSubmitting ? 'Подключаем…' : 'Присоединиться'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSubject && (
        <div className="app-modal" role="dialog" aria-modal="true">
          <div className="app-modal-card">
            <h3>{selectedSubject.title}</h3>
            <p className="subject-modal-meta">
              Автор: <strong>{selectedSubject.authorName ?? '—'}</strong>
            </p>
            <ul className="subject-modal-list">
              <li>
                Команд: <strong>{selectedSubject.teamCount}</strong>
              </li>
              <li>
                Дедлайн предмета:{' '}
                <strong>{selectedSubject.deadlineLabel ?? 'Не назначен'}</strong>
              </li>
            </ul>
            {selectedSubject.joinCode ? (
              <div className="subject-modal-code">
                <span>Код предмета:</span>
                <button
                  type="button"
                  className="ghost small"
                  onClick={handleCopyJoinCode}
                  disabled={isCopyingCode}
                >
                  {selectedSubject.joinCode}
                </button>
              </div>
            ) : (
              <p className="form-error">Для этого предмета пока нет кода подключения.</p>
            )}
            {copySuccess && <p className="copy-status">{copySuccess}</p>}
            <div className="app-modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  setSelectedSubject(null);
                  setCopySuccess(null);
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatSubjectDeadline(subject: ApiSubject): string | undefined {
  if (subject.deadline) {
    return new Date(subject.deadline).toLocaleDateString('ru-RU');
  }

  const sorted = (subject.teams ?? [])
    .filter((team) => Boolean(team.deadline))
    .map((team) => new Date(team.deadline as string))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!sorted.length) {
    return undefined;
  }

  return sorted[0].toLocaleDateString('ru-RU');
}

function mapTeams(items: ApiTeamMembership[]): TeamCard[] {
  return items.map((membership) => ({
    id: membership.team.id,
    name: membership.team.name,
    subjectTitle: membership.team.subject.title,
    deadlineLabel: membership.team.deadline
      ? new Date(membership.team.deadline).toLocaleDateString('ru-RU')
      : 'Без дедлайна',
    membersCount: membership.team.members?.length ?? 1,
    adminName: membership.team.admin?.name ?? 'Без админа',
    joinCode: membership.team.joinCode,
  }));
}
