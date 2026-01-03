import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, UserPlus, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Fellowship, TeamMember } from '../types';

export default function FellowshipManagement() {
  const [fellowships, setFellowships] = useState<Fellowship[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFellowship, setShowAddFellowship] = useState(false);
  const [showAddMember, setShowAddMember] = useState<string | null>(null);
  const [newFellowshipName, setNewFellowshipName] = useState('');
  const [newMember, setNewMember] = useState({ name: '', email: '' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: fellowshipsData } = await supabase
        .from('fellowships')
        .select('*')
        .order('created_at', { ascending: true });

      const { data: membersData } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: true });

      setFellowships(fellowshipsData || []);
      setTeamMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddFellowship = async () => {
    if (!newFellowshipName.trim()) return;

    try {
      const { data, error } = await supabase
        .from('fellowships')
        .insert({ name: newFellowshipName })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setFellowships([...fellowships, data]);
        setNewFellowshipName('');
        setShowAddFellowship(false);
      }
    } catch (error) {
      console.error('Error adding fellowship:', error);
      alert('Failed to add fellowship');
    }
  };

  const handleDeleteFellowship = async (id: string) => {
    if (!confirm('Are you sure? This will also remove all team members in this fellowship.')) {
      return;
    }

    try {
      await supabase.from('fellowships').delete().eq('id', id);
      setFellowships(fellowships.filter(f => f.id !== id));
      setTeamMembers(teamMembers.filter(m => m.fellowship_id !== id));
    } catch (error) {
      console.error('Error deleting fellowship:', error);
      alert('Failed to delete fellowship');
    }
  };

  const handleAddMember = async (fellowshipId: string) => {
    if (!newMember.name.trim()) {
      alert('Please enter a name');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({
          name: newMember.name,
          email: newMember.email || null,
          fellowship_id: fellowshipId,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setTeamMembers([...teamMembers, data]);
        setNewMember({ name: '', email: '' });
        setShowAddMember(null);
      }
    } catch (error) {
      console.error('Error adding team member:', error);
      alert('Failed to add team member');
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return;

    try {
      await supabase.from('team_members').delete().eq('id', id);
      setTeamMembers(teamMembers.filter(m => m.id !== id));
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('Failed to delete team member');
    }
  };

  const getMembersForFellowship = (fellowshipId: string) => {
    return teamMembers.filter(m => m.fellowship_id === fellowshipId);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Fellowship Management
          <span className="ml-2 text-lg text-gray-500">({fellowships.length})</span>
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
          <button
            onClick={() => setShowAddFellowship(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Fellowship
          </button>
        </div>
      </div>

      {showAddFellowship && (
        <div className="mb-6 p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">New Fellowship</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newFellowshipName}
              onChange={(e) => setNewFellowshipName(e.target.value)}
              placeholder="Fellowship name"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleAddFellowship()}
            />
            <button
              onClick={handleAddFellowship}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowAddFellowship(false);
                setNewFellowshipName('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {fellowships.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No fellowships found. Click "Add Fellowship" to create one.
        </div>
      ) : (
        <div className="space-y-4">
          {fellowships.map((fellowship) => {
            const members = getMembersForFellowship(fellowship.id);

            return (
              <div key={fellowship.id} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{fellowship.name}</h3>
                      <p className="text-sm text-gray-600">{members.length} team members</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddMember(fellowship.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Member
                    </button>
                    <button
                      onClick={() => handleDeleteFellowship(fellowship.id)}
                      className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete Fellowship"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {showAddMember === fellowship.id && (
                  <div className="mb-4 p-4 border-2 border-green-500 rounded-lg bg-green-50">
                    <h4 className="text-md font-semibold text-gray-800 mb-3">New Team Member</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="Member name (required)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <input
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        placeholder="Email (optional)"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddMember(fellowship.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Add Member
                        </button>
                        <button
                          onClick={() => {
                            setShowAddMember(null);
                            setNewMember({ name: '', email: '' });
                          }}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {members.length > 0 ? (
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-gray-800">{member.name}</p>
                          {member.email && (
                            <p className="text-sm text-gray-600">{member.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteMember(member.id)}
                          className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No team members yet</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
