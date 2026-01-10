import '../App.css';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TeamDetails } from '../components/TeamDetails';
import { type AuthUser } from '../components/AuthBar';
import { api } from '../api/axios';
import {
  getTeamDetails,
  createTeamTask,
  updateTaskStatus,
  type TeamDetailsResponse,
} from '../api/teams';

type ApiTeamMembership = {
  id: number;
  role: 'admin' | 'member';
  team: {
    id: number;
    name: string;
    deadline: string | null;
    joinCode: string;
    admin: { id: number; name: string | null } | null;
    subject: { id: number; title: string };
    members?: { id: number }[];
  };
};

type TeamCard = {
  id: number;
  name: string;
  subjectTitle: string;
  deadlineLabel: string;
  membersCount: number;
  adminName: string;
  joinCode: string;
};

export function TeamPage() {
  const navigate = useNavigate();
  const { teamCode } = useParams<{ teamCode: string }>();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [teams, setTeams] = useState<TeamCard[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamDetails, setTeamDetails] = useState<TeamDetailsResponse | null>(null);
  const [teamDetailsLoading, setTeamDetailsLoading] = useState(false);
  const [teamDetailsError, setTeamDetailsError] = useState<string | null>(null);
  const [authLoaded, setAuthLoaded] = useState(false);

  const loadTeams = useCallback(async () => {
    if (!currentUser) {
      return;
    }
    setTeamsLoading(true);
    try {
      const { data } = await api.get<ApiTeamMembership[]>('/teams/mine');
      setTeams(mapTeams(data));
    } catch (error) {
      console.error(error);
      setTeams([]);
    } finally {
      setTeamsLoading(false);
    }
  }, [currentUser]);

  const fetchTeamDetails = useCallback(
    async (teamId: number) => {
      if (!currentUser) {
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
      setAuthLoaded(true);
      return;
    }

    setAuthLoaded(false);

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
      })
      .catch(() => {
        localStorage.removeItem('accessToken');
        setCurrentUser(null);
      })
      .finally(() => setAuthLoaded(true));
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setTeams([]);
      setTeamDetails(null);
      return;
    }
    loadTeams();
  }, [currentUser, loadTeams]);

  useEffect(() => {
    if (!authLoaded || teamsLoading || !teamCode) {
      return;
    }

    const code = teamCode.toUpperCase();
    if (!/^[A-Z0-9]+$/.test(code)) {
      setTeamDetailsError('Неверный код команды');
      return;
    }

    const found = teams.find((t) => t.joinCode === code);
    if (found) {
      fetchTeamDetails(found.id);
    }
  }, [authLoaded, teamsLoading, teamCode, teams, fetchTeamDetails]);

  const handleJoinTeam = async () => {
    if (!currentUser || !teamCode) {
      return;
    }

    try {
      const code = teamCode.toUpperCase();
      await api.post('/teams/join', { joinCode: code });
      setTeamDetailsError(null);
      await loadTeams();
    } catch (err) {
      console.error(err);
      setTeamDetailsError('Не удалось присоединиться к команде');
    }
  };

  async function handleCreateTeamTask(payload: {
    title: string;
    description?: string;
    assigneeIds: number[];
    deadline?: string;
    dependencyIds?: number[];
  }) {
    if (!teamCode || !teamDetails) {
      return;
    }
    const found = teams.find((t) => t.joinCode === teamCode.toUpperCase());
    if (!found) {
      return;
    }
    await createTeamTask(found.id, payload);
    await fetchTeamDetails(found.id);
  }

  async function handleToggleTeamTask(taskId: number, isCompleted: boolean) {
    if (!teamCode || !teamDetails) {
      return;
    }
    const found = teams.find((t) => t.joinCode === teamCode.toUpperCase());
    if (!found) {
      return;
    }
    await updateTaskStatus(found.id, taskId, isCompleted);
    await fetchTeamDetails(found.id);
  }

  if (!authLoaded || teamsLoading) {
    return (
      <div className="workspace-shell">
        <div className="panel-placeholder">Загрузка…</div>
      </div>
    );
  }

  if (!teamCode) {
    return (
      <div className="workspace-shell">
        <div className="panel-placeholder error">Код команды не указан</div>
      </div>
    );
  }

  const code = teamCode.toUpperCase();
  const found = teams.find((t) => t.joinCode === code);

  return (
    <div className="workspace-shell">
      <header className="workspace-header">
        <div>
          <h1>Рабочая область: {code}</h1>
          <p className="muted">Откройте проект или присоединитесь по коду</p>
        </div>
        <div>
          <button
            type="button"
            className="ghost small"
            onClick={() => {
              navigate('/');
            }}
          >
            Вернуться
          </button>
        </div>
      </header>
      <main className="workspace-main">
        {!currentUser ? (
          <div className="workspace-guest">
            <p>Войдите, чтобы присоединиться или просмотреть рабочую область.</p>
          </div>
        ) : found ? (
          <div className="workspace-team">
            {teamDetailsLoading && <p className="panel-placeholder">Загружаем команду…</p>}
            {teamDetailsError && <p className="panel-placeholder error">{teamDetailsError}</p>}
            {teamDetails && (
              <TeamDetails
                team={teamDetails}
                currentUser={currentUser}
                onCreateTask={handleCreateTeamTask}
                onToggleTask={handleToggleTeamTask}
                onClose={() => {}}
              />
            )}
          </div>
        ) : (
          <div className="workspace-join">
            <p>Вы не участник этой команды.</p>
            <p>
              Код команды: <strong>{code}</strong>
            </p>
            <div className="workspace-actions">
              <button type="button" className="primary" onClick={handleJoinTeam}>
                Присоединиться к команде
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
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
