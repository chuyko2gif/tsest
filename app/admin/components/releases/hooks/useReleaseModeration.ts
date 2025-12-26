import { useState, useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

export interface Release {
  id: string;
  created_at: string;
  release_type: 'basic' | 'exclusive';
  title: string;
  artist_name: string;
  cover_url: string;
  genre: string;
  status: string;
  payment_status: string | null;
  payment_receipt_url: string | null;
  payment_amount: number | null;
  user_email: string;
  user_name: string;
  user_avatar?: string;
  user_nickname?: string;
  tracks_count: number;
  user_role: 'basic' | 'exclusive';
}

export function useReleaseModeration(supabase: SupabaseClient, statusFilter: string, viewMode: 'moderation' | 'archive') {
  const [releases, setReleases] = useState<Release[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRelease, setSelectedRelease] = useState<any | null>(null);

  useEffect(() => {
    loadReleases();
  }, [statusFilter, viewMode]);

  const loadReleases = async () => {
    if (!supabase) return;
    
    setLoading(true);
    try {
      let query1 = supabase
        .from('releases_basic')
        .select('*');
      
      let query2 = supabase
        .from('releases_exclusive')
        .select('*');
      
      if (viewMode === 'moderation') {
        if (statusFilter !== 'all') {
          query1 = query1.eq('status', statusFilter);
          query2 = query2.eq('status', statusFilter);
        }
      } else {
        query1 = query1.eq('status', 'approved');
        query2 = query2.eq('status', 'approved');
      }
      
      const [{ data: basicReleases }, { data: exclusiveReleases }] = await Promise.all([
        query1,
        query2
      ]);
      
      const allReleases: Release[] = [
        ...(basicReleases || []).map((r: any) => ({
          ...r,
          release_type: 'basic' as const,
          tracks_count: Array.isArray(r.tracks) ? r.tracks.length : 0,
        })),
        ...(exclusiveReleases || []).map((r: any) => ({
          ...r,
          release_type: 'exclusive' as const,
          tracks_count: Array.isArray(r.tracks) ? r.tracks.length : 0,
        }))
      ];
      
      allReleases.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setReleases(allReleases);
    } catch (error) {
      console.error('Error loading releases:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFullRelease = async (releaseId: string, releaseType: 'basic' | 'exclusive') => {
    try {
      const table = releaseType === 'basic' ? 'releases_basic' : 'releases_exclusive';
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', releaseId)
        .single();
      
      if (error) throw error;
      
      if (data.user_email) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nickname, avatar, role')
          .eq('email', data.user_email)
          .single();
        
        if (profile) {
          data.user_nickname = profile.nickname;
          data.user_avatar = profile.avatar;
          data.user_role = profile.role;
        }
      }
      
      setSelectedRelease(data);
      return data;
    } catch (error) {
      console.error('Error loading full release:', error);
      return null;
    }
  };

  return {
    releases,
    loading,
    selectedRelease,
    setSelectedRelease,
    loadReleases,
    loadFullRelease
  };
}
