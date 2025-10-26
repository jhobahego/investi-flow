// ===============================
// TIPOS BASADOS EN LA API
// ===============================

// --- ENUMS ---
export enum ProjectStatus {
  PLANNING = 'planning',
  IN_PROGRESS = 'in_progress',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum ResearchType {
  BASIC = 'basic',
  APPLIED = 'applied',
  EXPERIMENTAL = 'experimental',
  THEORETICAL = 'theoretical',
  QUALITATIVE = 'qualitative',
  QUANTITATIVE = 'quantitative',
  MIXED = 'mixed'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold'
}

export enum FileType {
  PDF = 'pdf',
  DOCX = 'docx'
}

// --- USER TYPES ---
export interface UserResponse {
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

export interface UserCreate {
  email: string
  full_name: string
  password: string
  phone_number: string
  university?: string | null
  research_group?: string | null
  career?: string | null
}

export interface UserUpdate {
  full_name?: string | null
  phone_number?: string | null
  university?: string | null
  research_group?: string | null
  career?: string | null
}

// --- AUTH TYPES ---
export interface Token {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface LoginPayload {
  username: string // This is the email
  password: string
  grant_type?: string | null
  scope?: string
  client_id?: string | null
  client_secret?: string | null
}

// Form data interfaces for the frontend
export interface LoginFormData {
  email: string
  password: string
}

// --- PROJECT TYPES ---
export interface ProjectResponse {
  id: number
  name: string
  description: string | null
  research_type: ResearchType | null
  institution: string | null
  research_group: string | null
  category: string | null
  status: ProjectStatus | null
  created_at: string
  updated_at: string
}

export interface ProjectCreate {
  name: string
  description?: string | null
  research_type?: ResearchType | null
  institution?: string | null
  research_group?: string | null
  category?: string | null
  status?: ProjectStatus | null
}

export interface ProjectUpdate {
  name?: string | null
  description?: string | null
  research_type?: ResearchType | null
  institution?: string | null
  research_group?: string | null
  category?: string | null
  status?: ProjectStatus | null
}

// --- PHASE TYPES ---
export interface PhaseResponse {
  id: number
  name: string
  position: number
  color: string | null
  project_id: number
}

export interface PhaseCreate {
  name: string
  position: number
  color?: string | null
  project_id: number
}

export interface PhaseUpdate {
  name?: string | null
  position?: number | null
  color?: string | null
}

export interface PhaseOrder {
  id: number
  position: number
}

// --- TASK TYPES ---
export interface TaskResponse {
  id: number
  title: string
  description: string | null
  position: number
  status: TaskStatus | null
  start_date: string | null
  end_date: string | null
  completed: boolean | null
  phase_id: number
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string | null
  position?: number
  status?: TaskStatus | null
  start_date?: string | null
  end_date?: string | null
  completed?: boolean | null
  phase_id: number
}

export interface TaskUpdate {
  title?: string | null
  description?: string | null
  position?: number | null
  status?: TaskStatus | null
  start_date?: string | null
  end_date?: string | null
  completed?: boolean | null
}

// --- ATTACHMENT TYPES ---
export interface AttachmentResponse {
  id: number
  file_name: string
  file_type: FileType
  file_size: number
  file_path: string
  project_id: number | null
  phase_id: number | null
  task_id: number | null
  created_at: string
  updated_at: string
}

// --- CONVERSATION & CHAT TYPES ---
export interface ChatMessage {
  id?: number
  role: 'user' | 'model'
  content: string
  model_used?: string | null
  created_at?: string
}

export interface Conversation {
  id: number
  title: string
  project_id: number
  user_id: number
  created_at: string
  updated_at: string
  messages: ChatMessage[]
}

export interface ConversationListItem {
  id: number
  title: string
  project_id: number
  user_id: number
  created_at: string
  updated_at: string
  message_count: number
  last_message_preview: string | null
}

export interface ChatRequest {
  message: string
  conversation_id?: number | null
  title?: string | null
}

export interface ChatResponse {
  response: string
  model_used: string
  conversation_id: number
  message_id: number
}

// --- ATTACHMENT TYPES ---
export interface AttachmentResponse {
  id: number
  file_name: string
  file_type: FileType
  file_size: number
  file_path: string
  project_id: number | null
  phase_id: number | null
  task_id: number | null
  created_at: string
  updated_at: string
}

// --- COMPOSITE TYPES FOR FRONTEND ---
export interface ProjectWithPhases extends ProjectResponse {
  phases: PhaseResponse[]
}

export interface PhaseWithTasks extends PhaseResponse {
  tasks: TaskResponse[]
}

export interface ProjectBoard {
  project: ProjectResponse
  phases: PhaseWithTasks[]
}

// --- LEGACY TYPES (Mantener compatibilidad con UI existente) ---
export interface ContentBlock {
  id: string
  type: 'user_text' | 'ai_suggestion'
  content: string
  created_at: string
  ai_context?: string
}

// --- ERROR TYPES ---
export interface ValidationErrorDetail {
  loc: (string | number)[]
  msg: string
  type: string
  input: string
}

export interface ApiError {
  detail: string
}

export interface ProcessedValidationError {
  errorMessage: string
  errorType: string
  inputValue: string
}

// Alias para compatibilidad
export type Project = ProjectResponse
export type User = UserResponse
export type ProjectCreatePayload = ProjectCreate
export type ProjectUpdatePayload = ProjectUpdate
export type TokenResponse = Token

