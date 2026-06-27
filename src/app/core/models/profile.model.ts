export interface Profile {
  id: string;
  preferred_day: number;
  language: 'it' | 'en';
  onboarding_completed: boolean;
  created_at: string;
}
