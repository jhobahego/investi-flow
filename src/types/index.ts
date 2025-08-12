export interface User {
  id: string
  email: string
  password?: string
  name: string
  avatar: string
  role: 'student' | 'researcher' | 'professor' | 'other'
  institution: string
}

export interface Project {
  id: string
  title: string
  description: string
  owner_id: string
  collaborators: string[]
  status: 'active' | 'draft' | 'completed'
  created_at: string
  updated_at: string
  phases: Phase[]
}

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

export interface RegisterFormData {
  name: string
  email: string
  institution: string
  role: string
  password: string
  confirmPassword: string
}

export interface LoginFormData {
  email: string
  password: string
}
