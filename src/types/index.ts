export interface PrayerRequest {
  id: string;
  request_number: string;
  name: string;
  mobile_number: string;
  prayer_text: string | null;
  voice_recording_url: string | null;
  image_url: string | null;
  document_url: string | null;
  status: 'pending' | 'completed';
  created_at: string;
  completed_at: string | null;
}

export interface Fellowship {
  id: string;
  name: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  user_id: string | null;
  name: string;
  email: string | null;
  fellowship_id: string;
  created_at: string;
}

export interface PrayerCompletion {
  id: string;
  prayer_request_id: string;
  team_member_id: string;
  completed_at: string;
}
