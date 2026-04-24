import { useNavigate } from "react-router";
import { useUser } from "@clerk/clerk-react";
import { useState } from "react";
import { useActiveSessions, useCreateSession, useMyRecentSessions } from "../hooks/useSessions";

import Navbar from "../components/Navbar";
import WelcomeSection from "../components/WelcomeSection";
import StatsCards from "../components/StatsCards";
import ActiveSessions from "../components/ActiveSessions";
import RecentSessions from "../components/RecentSessions";
import CreateSessionModal from "../components/CreateSessionModal";
import AnalysisCard from "../components/AnalysisCard";

function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomConfig, setRoomConfig] = useState({ problem: "", difficulty: "" });

  const createSessionMutation = useCreateSession();

  const { data: activeSessionsData, isLoading: loadingActiveSessions } = useActiveSessions();
  const { data: recentSessionsData, isLoading: loadingRecentSessions } = useMyRecentSessions();

  const handleCreateRoom = () => {
    if (!roomConfig.problem || !roomConfig.difficulty) return;

    createSessionMutation.mutate(
      {
        problem:    roomConfig.problem,
        difficulty: roomConfig.difficulty.toLowerCase(),
      },
      {
        onSuccess: (data) => {
          setShowCreateModal(false);
          navigate(`/session/${data.session._id}`);
        },
      }
    );
  };

  const activeSessions  = activeSessionsData?.sessions || [];
  const recentSessions  = recentSessionsData?.sessions || [];

  const isUserInSession = (session) => {
    if (!user?.id) return false;
    return session.host?.clerkId === user.id || session.participant?.clerkId === user.id;
  };

  return (
    <>
      <div className="min-h-screen bg-base-300">
        <Navbar />
        <WelcomeSection onCreateSession={() => setShowCreateModal(true)} />

        <div className="container mx-auto px-6 pb-16 space-y-6">

          {/* Top grid — stats + active sessions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <StatsCards
              activeSessionsCount={activeSessions.length}
              recentSessionsCount={recentSessions.length}
            />
            <ActiveSessions
              sessions={activeSessions}
              isLoading={loadingActiveSessions}
              isUserInSession={isUserInSession}
            />
          </div>

          {/* Recent sessions */}
          <RecentSessions
            sessions={recentSessions}
            isLoading={loadingRecentSessions}
          />

          {/* ML Analysis — shown for each completed session */}
          {recentSessions.filter((s) => s.status === "completed").length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-base-content">Session analyses</h2>
              {recentSessions
                .filter((s) => s.status === "completed")
                .map((session) => (
                  <div key={session._id} className="space-y-2">

                    {/* session label */}
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-base-content">{session.problem}</span>
                      <span className="badge badge-ghost badge-sm">{session.difficulty}</span>
                      <span className="text-xs text-base-content/50">
                        {new Date(session.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* analysis card */}
                    <AnalysisCard sessionId={session._id} />

                  </div>
                ))}
            </div>
          )}

        </div>
      </div>

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        roomConfig={roomConfig}
        setRoomConfig={setRoomConfig}
        onCreateRoom={handleCreateRoom}
        isCreating={createSessionMutation.isPending}
      />
    </>
  );
}

export default DashboardPage;