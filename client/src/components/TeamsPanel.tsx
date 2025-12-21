import './TeamsPanel.css';

export type TeamCard = {
  id: number;
  name: string;
  subjectTitle: string;
  deadlineLabel: string;
  membersCount: number;
  adminName: string;
  joinCode: string;
};

interface TeamsPanelProps {
  teams: TeamCard[];
  onCreateTeam?: () => void;
  onEnterCode?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  error?: string | null;
  // now receives the team's join code so UI can open a dedicated URL
  onSelectTeam?: (teamCode: string) => void;
  activeTeamId?: number | null;
}

export function TeamsPanel({
  teams,
  onCreateTeam,
  onEnterCode,
  disabled,
  isLoading,
  error,
  onSelectTeam,
  activeTeamId,
}: TeamsPanelProps) {
  const renderContent = () => {
    if (isLoading) {
      return <p className="panel-placeholder">Загружаем команды…</p>;
    }

    if (error) {
      return <p className="panel-placeholder error">{error}</p>;
    }

    if (!teams.length) {
      return (
        <p className="panel-placeholder">
          Ты ещё не в командах. Создай новую или присоединись по коду.
        </p>
      );
    }

    return (
      <ul className="teams-list">
        {teams.map((team) => (
          <li
            key={team.id}
            className={`team-card ${team.id === activeTeamId ? 'selected' : ''}`}
            onClick={onSelectTeam ? () => onSelectTeam(team.joinCode) : undefined}
            onKeyDown={
              onSelectTeam
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onSelectTeam(team.joinCode);
                    }
                  }
                : undefined
            }
            role={onSelectTeam ? 'button' : undefined}
            tabIndex={onSelectTeam ? 0 : undefined}
          >
            <div className="team-card-header">
              <div>
                <p className="team-name">{team.name}</p>
                <p className="team-subject">{team.subjectTitle}</p>
              </div>
              <span className="team-status">Код: {team.joinCode}</span>
            </div>
            <div className="team-meta">
              <span>{team.membersCount} участников</span>
              <span>Админ: {team.adminName}</span>
              <span>Дедлайн: {team.deadlineLabel}</span>
            </div>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section className="panel teams-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Команды</p>
          <h2>Мои команды</h2>
        </div>
        <div className="panel-actions">
          {onCreateTeam && (
            <button
              type="button"
              className="ghost small"
              onClick={onCreateTeam}
              disabled={disabled}
            >
              Создать
            </button>
          )}
          {onEnterCode && (
            <button
              type="button"
              className="ghost small"
              onClick={onEnterCode}
              disabled={disabled}
            >
              Ввести код
            </button>
          )}
        </div>
      </div>

      {renderContent()}
    </section>
  );
}


