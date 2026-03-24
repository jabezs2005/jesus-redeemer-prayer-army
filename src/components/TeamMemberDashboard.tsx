import { useState, useEffect } from 'react';
import { LogOut, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { PrayerRequest, TeamMember } from '../types';

export default function TeamMemberDashboard() {
  const { user, signOut } = useAuth();
  const [teamMember, setTeamMember] = useState<TeamMember | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PrayerRequest[]>([]);
  const [completedRequests, setCompletedRequests] = useState<PrayerRequest[]>([]);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'completed'>('pending');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMemberData();
  }, [user]);

  const fetchTeamMemberData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data: memberData } = await supabase
        .from('team_members')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberData) {
        setTeamMember(memberData);
        await fetchPrayerRequests(memberData.id);
      }
    } catch (err) {
      console.error('Error fetching team member data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrayerRequests = async (teamMemberId: string) => {
    try {
      const { data: completions } = await supabase
        .from('prayer_completions')
        .select('prayer_request_id')
        .eq('team_member_id', teamMemberId);

      const completedIds = completions?.map(c => c.prayer_request_id) || [];

      const { data: pending } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      const { data: completed } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      setPendingRequests(pending || []);
      setCompletedRequests(
        completed?.filter(req => completedIds.includes(req.id)) || []
      );
    } catch (err) {
      console.error('Error fetching prayer requests:', err);
    }
  };

  const markAsCompleted = async (requestId: string) => {
    if (!teamMember) return;

    setCompletingId(requestId);
    try {
      const { error: completionError } = await supabase
        .from('prayer_completions')
        .insert([
          {
            prayer_request_id: requestId,
            team_member_id: teamMember.id,
          },
        ]);

      if (completionError) throw completionError;

      const { error: updateError } = await supabase
        .from('prayer_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      await fetchTeamMemberData();
    } catch (err) {
      console.error('Error marking as completed:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!teamMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Team member profile not found</p>
          <button
            onClick={handleSignOut}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Sign out and try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Prayer Requests</h1>
            <p className="text-gray-600 text-sm mt-1">
              {teamMember.name} • {teamMember.fellowship_id}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('pending')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'pending'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pending Requests ({pendingRequests.length})
            </div>
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`pb-4 px-2 font-medium transition ${
              activeTab === 'completed'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Completed ({completedRequests.length})
            </div>
          </button>
        </div>

        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No pending prayer requests at the moment</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                          {request.request_number}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.mobile_number}</p>
                    </div>
                  </div>

                  {request.prayer_text && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{request.prayer_text}</p>
                    </div>
                  )}

                  <button
                    onClick={() => markAsCompleted(request.id)}
                    disabled={completingId === request.id}
                    className="flex items-center gap-2 mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                  >
                    {completingId === request.id ? (
                      'Marking as completed...'
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Mark as Completed
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'completed' && (
          <div className="space-y-4">
            {completedRequests.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No completed prayer requests yet</p>
              </div>
            ) : (
              completedRequests.map((request) => (
                <div
                  key={request.id}
                  className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          {request.request_number}
                        </span>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-500">
                          Completed: {new Date(request.completed_at!).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{request.name}</h3>
                      <p className="text-sm text-gray-600">{request.mobile_number}</p>
                    </div>
                  </div>

                  {request.prayer_text && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap">{request.prayer_text}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
