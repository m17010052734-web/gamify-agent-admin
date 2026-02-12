// User types
export interface User {
  id: string;
  nickname: string | null;
  avatar_url: string | null;
  status: 'active' | 'banned';
  work_count: number;
  follower_count: number;
  credit_balance: number;
  last_login_at: string | null;
  created_at: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Game types
export interface Game {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  project_type: string;
  author_id: string;
  author_nickname: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface GameDetail extends Game {
  generation_mode: string;
  tech_stack: string;
  artifact_type: string;
  version_count: number;
}

export interface GameReviewListResponse {
  items: Game[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Credit types
export interface CreditConfig {
  config_key: string;
  config_value: number;
  description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreditConfigListResponse {
  items: CreditConfig[];
  total: number;
}

// Stats types
export interface PlatformStats {
  total_users: number;
  active_users: number;
  banned_users: number;
  total_games: number;
  published_games: number;
  pending_games: number;
  total_credits_issued: number;
  total_credits_consumed: number;
}

// Credit flow types
export interface CreditFlowItem {
  id: string;
  change_type: 'income' | 'expense';
  amount: number;
  balance_after: number;
  source_type: string;
  description: string | null;
  created_at: string;
}

export interface CreditFlowResponse {
  items: CreditFlowItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Review log types
export interface ReviewLog {
  id: string;
  game_id: string;
  game_title: string;
  admin_id: string;
  status: 'approved' | 'rejected';
  message: string | null;
  created_at: string;
}

export interface ReviewLogListResponse {
  items: ReviewLog[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Index game library types
export interface VersionCodeInfo {
  html_code: string | null;
  code_snapshot: string | null;
}

export interface IndexGame {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  thumbnail_url: string | null;
  source_type: 'url' | 'code';
  game_url: string | null;
  version_code_id: string | null;
  category: string;
  tags: string[];
  show_in_banner: boolean;
  weight: number;
  status: 'active' | 'inactive';
  play_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  version_code?: VersionCodeInfo;
}

export interface IndexGameListResponse {
  items: IndexGame[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
