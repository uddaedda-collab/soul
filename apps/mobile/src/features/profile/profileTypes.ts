export interface UserProfile {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  favoriteGenres: string[];
  relationshipStatus?: 'dating' | 'engaged' | 'married' | 'private';
  online: boolean;
  watchStats: {
    totalMinutes: number;
    roomsCreated: number;
    reactionsSent: number;
    currentStreakDays: number;
  };
  reminders: Array<{
    id: string;
    title: string;
    date: string;
  }>;
}
