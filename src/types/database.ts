export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  consent_sms: boolean;
  consent_email: boolean;
  consent_voice_ai: boolean;
  updated_at: string;
};

export type Violation = {
  id: string;
  user_id: string;
  violation_date: string;
  description: string | null;
  is_accruing: boolean;
  fine_balance: number;
  cure_photo_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type HardCost = {
  id: string;
  violation_id: string;
  description: string;
  amount: number;
  created_at: string;
};
