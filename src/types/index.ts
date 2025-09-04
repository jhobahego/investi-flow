// Types for API Payloads and Responses

// From app/schemas/user.py
export interface User {
  id: number
  email: string
  full_name: string
  phone_number: string | null
  university: string | null
  research_group: string | null
  career: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface UserCreatePayload {
  email: string
  full_name: string
  password: string
  phone_number: string
  university?: string
  research_group?: string
  career?: string
}

// From app/schemas/token.py
export interface LoginPayload {
  username: string // This is the email
  password: string
}

// Form data interfaces for the frontend
export interface LoginFormData {
  email: string
  password: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

// From app/models/project.py
export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

export enum ResearchType {
  THEORETICAL = 'theoretical',
  APPLIED = 'applied',
  DESCRIPTIVE = 'descriptive',
  EXPLORATORY = 'exploratory',
  CORRELATIONAL = 'correlational',
  EXPLANATORY = 'explanatory',
  EXPERIMENTAL = 'experimental',
  QUALITATIVE = 'qualitative',
  QUANTITATIVE = 'quantitative',
  MIXED = 'mixed'
}

// From app/schemas/project.py
export interface Project {
  id: number
  owner_id: number
  name: string
  description: string | null
  research_type: ResearchType | null
  institution: string | null
  research_group: string | null
  category: string | null
  status: ProjectStatus
  created_at: string
  updated_at: string
}

export interface ProjectCreatePayload {
  name: string
  description?: string
  research_type?: ResearchType
  institution?: string
  research_group?: string
  category?: string
  status?: ProjectStatus
}

export interface ProjectUpdatePayload {
  name?: string
  description?: string
  research_type?: ResearchType
  institution?: string
  research_group?: string
  category?: string
  status?: ProjectStatus
}

// --- Manteniendo interfaces existentes si aún son necesarias para la UI ---

export interface Phase {
  id: string
  title: string
  order: number
  color: string
}

export interface Task {
  id: string
  project_id: string
  phase_id: string
  title: string
  order: number
  created_by: string
  created_at: string
  content_blocks: ContentBlock[]
}

export interface ContentBlock {
  id: string
  type: 'user_text' | 'ai_suggestion'
  content: string
  created_at: string
  ai_context?: string
}
