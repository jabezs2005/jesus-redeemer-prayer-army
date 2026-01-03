import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, Phone, Calendar, Volume2, Image as ImageIcon, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PrayerRequest, TeamMember, PrayerCompletion } from '../types';

interface PrayerRequestsListProps {
  status: 'pending' | 'completed';
}

export default function PrayerRequestsList({ status }: PrayerRequestsListProps) {
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [completions, setCompletions] = useState<PrayerCompletion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PrayerRequest | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: requestsData } = await supabase
        .from('prayer_requests')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      const { data: membersData } = await supabase
        .from('team_members')
        .select('*');

      const { data: completionsData } = await supabase
        .from('prayer_completions')
        .select('*');

      setRequests(requestsData || []);
      setTeamMembers(membersData || []);
      setCompletions(completionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [status]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prayer request?')) return;

    try {
      await supabase.from('prayer_requests').delete().eq('id', id);
      setRequests(requests.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting request:', error);
    }
  };

  const handleMarkComplete = async (id: string) => {
    try {
      await supabase
        .from('prayer_requests')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', id);

      setRequests(requests.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error marking as complete:', error);
    }
  };

  const togglePrayerCompletion = async (requestId: string, memberId: string) => {
    const existing = completions.find(
      c => c.prayer_request_id === requestId && c.team_member_id === memberId
    );

    try {
      if (existing) {
        await supabase
          .from('prayer_completions')
          .delete()
          .eq('id', existing.id);

        setCompletions(completions.filter(c => c.id !== existing.id));
      } else {
        const { data } = await supabase
          .from('prayer_completions')
          .insert({ prayer_request_id: requestId, team_member_id: memberId })
          .select()
          .single();

        if (data) {
          setCompletions([...completions, data]);
        }
      }
    } catch (error) {
      console.error('Error toggling prayer completion:', error);
    }
  };

  const getMemberCompletions = (requestId: string) => {
    return completions.filter(c => c.prayer_request_id === requestId);
  };

  const isMemberCompleted = (requestId: string, memberId: string) => {
    return completions.some(
      c => c.prayer_request_id === requestId && c.team_member_id === memberId
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {status === 'pending' ? 'Pending' : 'Completed'} Prayer Requests
          <span className="ml-2 text-lg text-gray-500">({requests.length})</span>
        </h2>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No {status} prayer requests found
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const memberCompletions = getMemberCompletions(request.id);
            const totalMembers = teamMembers.length;
            const completedCount = memberCompletions.length;

            return (
              <div key={request.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                        {request.request_number}
                      </span>
                      {status === 'pending' && totalMembers > 0 && (
                        <span className="text-sm text-gray-600">
                          Prayed by {completedCount}/{totalMembers} members
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{request.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        {request.mobile_number}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    {request.prayer_text && (
                      <p className="text-gray-700 mb-3">{request.prayer_text}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {request.voice_recording_url && (
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                        >
                          <Volume2 className="w-4 h-4" />
                          Voice Recording
                        </button>
                      )}
                      {request.image_url && (
                        <a
                          href={request.image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                        >
                          <ImageIcon className="w-4 h-4" />
                          Image
                        </a>
                      )}
                      {request.document_url && (
                        <a
                          href={request.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Document
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {status === 'pending' && (
                      <button
                        onClick={() => handleMarkComplete(request.id)}
                        className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                        title="Mark as Complete"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {status === 'pending' && teamMembers.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Prayer Team:</p>
                    <div className="flex flex-wrap gap-2">
                      {teamMembers.map((member) => {
                        const completed = isMemberCompleted(request.id, member.id);
                        return (
                          <button
                            key={member.id}
                            onClick={() => togglePrayerCompletion(request.id, member.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              completed
                                ? 'bg-green-100 text-green-800 border-2 border-green-500'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {member.name}
                            {completed && <CheckCircle className="w-4 h-4" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedRequest?.voice_recording_url && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              Voice Recording - {selectedRequest.request_number}
            </h3>
            <audio
              controls
              className="w-full mb-4"
              src={selectedRequest.voice_recording_url}
            >
              Your browser does not support the audio element.
            </audio>
            <button
              onClick={() => setSelectedRequest(null)}
              className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
