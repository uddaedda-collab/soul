import axios from 'axios';
import { Activity, AlertTriangle, DoorOpen, Film, RefreshCw, Shield, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import './styles.css';

interface Overview {
  metrics: {
    activeRooms: number;
    onlineParticipants: number;
    reportsOpen: number;
    users: number;
  };
  rooms: Array<{
    id: string;
    code: string;
    title: string;
    mode: 'host' | 'shared';
    visibility: 'private' | 'public';
    updatedAt: number;
    playback: {
      status: string;
      media?: {
        title: string;
        provider: string;
      };
    };
    participants: Record<string, { displayName: string; online: boolean }>;
  }>;
  reports: Array<{
    id: string;
    reporterId: string;
    targetUserId?: string;
    roomId?: string;
    messageId?: string;
    reason: string;
    status: string;
    createdAt: number;
  }>;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:8080',
  headers: import.meta.env.VITE_ADMIN_TOKEN ? { Authorization: `Bearer ${import.meta.env.VITE_ADMIN_TOKEN}` } : undefined
});

export default function App() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<Overview>('/admin/overview');
      setOverview(data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Could not load overview');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const metrics = useMemo(() => {
    const data = overview?.metrics ?? {
      activeRooms: 0,
      onlineParticipants: 0,
      reportsOpen: 0,
      users: 0
    };
    return [
      { label: 'Active Rooms', value: data.activeRooms, icon: DoorOpen },
      { label: 'Online Viewers', value: data.onlineParticipants, icon: Users },
      { label: 'Open Reports', value: data.reportsOpen, icon: AlertTriangle },
      { label: 'Users', value: data.users, icon: Shield }
    ];
  }, [overview]);

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">S</div>
          <div>
            <strong>SoulSync</strong>
            <span>Admin Center</span>
          </div>
        </div>
        <nav>
          <a className="active"><Activity size={18} /> Overview</a>
          <a><Users size={18} /> Users</a>
          <a><Film size={18} /> Rooms</a>
          <a><AlertTriangle size={18} /> Reports</a>
        </nav>
      </aside>

      <section className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Realtime Operations</p>
            <h1>Room monitoring</h1>
          </div>
          <button onClick={() => void load()} disabled={loading}>
            <RefreshCw size={17} />
            Refresh
          </button>
        </header>

        {error ? <div className="notice">{error}. Add a valid admin token in `apps/admin/.env`.</div> : null}

        <div className="metrics">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <article className="metric" key={metric.label}>
                <Icon size={22} />
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            );
          })}
        </div>

        <section className="panel">
          <div className="panelHeader">
            <h2>Live rooms</h2>
            <span>{overview?.rooms.length ?? 0} tracked</span>
          </div>
          <div className="roomList">
            {(overview?.rooms ?? []).map((room) => {
              const online = Object.values(room.participants).filter((participant) => participant.online);
              return (
                <article className="room" key={room.id}>
                  <div>
                    <strong>{room.title}</strong>
                    <span>{room.code} / {room.visibility} / {room.mode}</span>
                  </div>
                  <div>
                    <strong>{room.playback.media?.title ?? 'No source'}</strong>
                    <span>{room.playback.status} / {room.playback.media?.provider ?? 'none'}</span>
                  </div>
                  <div>
                    <strong>{online.length}</strong>
                    <span>online</span>
                  </div>
                </article>
              );
            })}
            {!overview?.rooms.length ? (
              <div className="empty">No active public rooms are available in the current backend store.</div>
            ) : null}
          </div>
        </section>

        <section className="panel">
          <div className="panelHeader">
            <h2>Safety reports</h2>
            <span>{overview?.reports.length ?? 0} recent</span>
          </div>
          <div className="roomList">
            {(overview?.reports ?? []).map((report) => (
              <article className="room" key={report.id}>
                <div>
                  <strong>{report.reason}</strong>
                  <span>{report.status} / reporter {report.reporterId}</span>
                </div>
                <div>
                  <strong>{report.roomId ?? report.targetUserId ?? 'General'}</strong>
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <strong>{report.messageId ? 'Message' : report.roomId ? 'Room' : 'User'}</strong>
                  <span>type</span>
                </div>
              </article>
            ))}
            {!overview?.reports.length ? (
              <div className="empty">No safety reports yet.</div>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
