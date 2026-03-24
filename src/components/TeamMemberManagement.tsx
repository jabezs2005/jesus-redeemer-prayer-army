import { useState, useEffect } from 'react';
import { Trash2, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TeamMember, Fellowship } from '../types';

export default function TeamMemberManagement() {
  const [teamMembers, setTeamMembers] = useState<(TeamMember & { fellowship_name: string })[]>([]);
  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
    fetchFellowships();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const memberPromises = (data || []).map(async (member) => {
        const { data: fellowship } = await supabase
          .from('fellowships')
          .select('name')
          .eq('id', member.fellowship_id)
          .maybeSingle();

        return {
          ...member,
          fellowship_name: fellowship?.name || 'Unknown',
        };
      });

      const membersWithFellowships = await Promise.all(memberPromises);
      setTeamMembers(membersWithFellowships);
    } catch (err) {
      console.error('Error fetching team members:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFellowships = async () => {
    try {
      const { data, error } = await supabase
        .from('fellowships')
        .select('*')
        .order('name');

      if (error) throw error;
      setFellowships(data || []);
    } catch (err) {
      console.error('Error fetching fellowships:', err);
    }
  };

  const deleteTeamMember = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTeamMembers(teamMembers.filter(member => member.id !== id));
    } catch (err) {
      console.error('Error deleting team member:', err);
      alert('Failed to delete team member');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-6 h-6 text-gray-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Team Members</h2>
        <p className="text-gray-600">Manage prayer team members ({teamMembers.length})</p>
      </div>

      {teamMembers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No team members registered yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Mobile</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Fellowship</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Joined</th>
                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => (
                <tr key={member.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900">{member.name}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{member.email || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">{member.mobile_number || '-'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-medium">
                      {member.fellowship_name}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-600">
                      {new Date(member.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteTeamMember(member.id)}
                      disabled={deleting === member.id}
                      className="text-red-600 hover:text-red-700 transition disabled:opacity-50"
                      title="Delete team member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
