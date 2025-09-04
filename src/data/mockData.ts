import {
  type User,
  type Project,
  type Task,
  type Phase,
  ProjectStatus
} from '../types'

// Mock phases for projects to maintain UI compatibility while integrating with API
export const mockPhases: Phase[] = [
  {
    id: 'idea',
    title: 'Idea de Investigación',
    order: 0,
    color: '#f3e8ff'
  },
  {
    id: 'problem',
    title: 'Planteamiento del Problema',
    order: 1,
    color: '#dbeafe'
  },
  {
    id: 'framework',
    title: 'Marco Teórico',
    order: 2,
    color: '#dcfce7'
  },
  {
    id: 'methodology',
    title: 'Metodología',
    order: 3,
    color: '#fef3c7'
  },
  {
    id: 'results',
    title: 'Resultados',
    order: 4,
    color: '#fed7d7'
  },
  {
    id: 'conclusions',
    title: 'Conclusiones',
    order: 5,
    color: '#e0e7ff'
  }
]

// Mock data for InvestiFlow platform
export const users: User[] = [
  {
    id: 1,
    email: 'juan.perez@universidad.edu',
    full_name: 'Juan Pérez',
    phone_number: '+573001234567',
    university: 'Universidad Nacional',
    research_group: null,
    career: null,
    is_active: true,
    is_verified: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: 2,
    email: 'maria.garcia@instituto.org',
    full_name: 'María García',
    phone_number: '+573009876543',
    university: 'Instituto de Investigación',
    research_group: 'Grupo de IA',
    career: 'Ingeniería de Sistemas',
    is_active: true,
    is_verified: true,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  }
]

export const projects: Project[] = [
  {
    id: 1,
    name: 'Impacto de la IA en la Educación Superior',
    description: 'Estudio sobre la implementación de inteligencia artificial en procesos educativos universitarios',
    owner_id: 1,
    status: ProjectStatus.PLANNING,
    research_type: null,
    institution: null,
    research_group: null,
    category: null,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-12-20T00:00:00Z'
  },
  {
    id: 2,
    name: 'Sostenibilidad en Arquitectura Urbana',
    description: 'Análisis de técnicas de construcción sostenible en centros urbanos',
    owner_id: 1,
    status: ProjectStatus.PLANNING,
    research_type: null,
    institution: null,
    research_group: null,
    category: null,
    created_at: '2024-12-10T00:00:00Z',
    updated_at: '2024-12-20T00:00:00Z'
  }
]

export const tasks: Task[] = [
  {
    id: '1',
    project_id: '1',
    phase_id: 'idea',
    title: 'Definir alcance de la investigación',
    order: 0,
    created_by: '1',
    created_at: '2024-01-15',
    content_blocks: [
      {
        id: '1',
        type: 'user_text',
        content: 'Necesitamos definir el alcance específico de nuestra investigación sobre IA en educación superior.',
        created_at: '2024-01-15'
      },
      {
        id: '2',
        type: 'ai_suggestion',
        content: 'Sugiero enfocar la investigación en tres áreas clave: 1) Herramientas de IA para personalización del aprendizaje, 2) Sistemas de evaluación automatizada, y 3) Chatbots educativos para soporte estudiantil. Esto permitirá un análisis completo pero manejable.',
        created_at: '2024-01-15',
        ai_context: 'scope_definition'
      }
    ]
  },
  {
    id: '2',
    project_id: '1',
    phase_id: 'problem',
    title: 'Identificar problemática central',
    order: 0,
    created_by: '1',
    created_at: '2024-01-20',
    content_blocks: [
      {
        id: '3',
        type: 'user_text',
        content: '¿Cómo plantear el problema de investigación de manera clara?',
        created_at: '2024-01-20'
      },
      {
        id: '4',
        type: 'ai_suggestion',
        content: 'Un planteamiento efectivo del problema debe incluir: 1) Situación actual (resistencia al cambio tecnológico en universidades), 2) Consecuencias (brecha entre tecnología disponible y su implementación efectiva), 3) Pregunta de investigación (¿Qué factores determinan el éxito en la implementación de IA educativa?)',
        created_at: '2024-01-20',
        ai_context: 'problem_statement'
      }
    ]
  },
  {
    id: '3',
    project_id: '1',
    phase_id: 'framework',
    title: 'Revisión bibliográfica inicial',
    order: 0,
    created_by: '2',
    created_at: '2024-02-01',
    content_blocks: [
      {
        id: '5',
        type: 'user_text',
        content: 'Necesito ayuda para encontrar fuentes relevantes sobre IA en educación.',
        created_at: '2024-02-01'
      },
      {
        id: '6',
        type: 'ai_suggestion',
        content: 'Te recomiendo estas fuentes clave: 1) "Artificial Intelligence in Education" por Baker & Smith (2023), 2) Journal of Educational Technology Research - números especiales sobre IA, 3) Proceedings of AIED Conference 2023, 4) UNESCO Report on AI in Education (2023). También sugiero revisar trabajos de Holmes, Bialik & Fadel sobre IA y aprendizaje.',
        created_at: '2024-02-01',
        ai_context: 'bibliography_suggestion'
      }
    ]
  }
];

export const lexiConversations = [
  {
    id: '1',
    task_id: '1',
    user_id: '1',
    messages: [
      {
        id: '1',
        type: 'user',
        content: 'Hola Lexi, necesito ayuda para definir el alcance de mi investigación sobre IA en educación.',
        timestamp: '2024-01-15T10:00:00Z'
      },
      {
        id: '2',
        type: 'ai',
        content: '¡Hola! Me encanta ayudarte con tu investigación. Para definir un alcance efectivo sobre IA en educación superior, te sugiero considerar estos aspectos: 1) ¿Qué nivel educativo específico quieres abordar? 2) ¿Te interesa más el impacto en estudiantes o en docentes? 3) ¿Hay alguna herramienta de IA particular que quieras estudiar?',
        timestamp: '2024-01-15T10:01:00Z'
      },
      {
        id: '3',
        type: 'user',
        content: 'Me interesa enfocarme en universitarios y herramientas de personalización del aprendizaje.',
        timestamp: '2024-01-15T10:05:00Z'
      },
      {
        id: '4',
        type: 'ai',
        content: 'Perfecto! Entonces podrías delimitar tu investigación así: "Impacto de herramientas de IA para personalización del aprendizaje en estudiantes universitarios de pregrado". Esto te permitirá estudiar sistemas adaptativos, recomendadores de contenido y rutas de aprendizaje personalizadas. ¿Te parece adecuado este enfoque?',
        timestamp: '2024-01-15T10:06:00Z'
      }
    ]
  }
];

export const aiSuggestions = {
  scope_definition: [
    "Considera delimitar tu investigación geográficamente (ej: universidades públicas de Colombia)",
    "Define el período temporal específico para tu estudio",
    "Especifica las disciplinas académicas que incluirás en el análisis"
  ],
  problem_statement: [
    "Utiliza datos estadísticos para respaldar la existencia del problema",
    "Incluye testimonios o casos específicos que ilustren la problemática",
    "Asegúrate de que el problema sea investigable y relevante socialmente"
  ],
  bibliography_suggestion: [
    "Busca artículos en bases de datos académicas como Scopus y Web of Science",
    "Incluye fuentes primarias y secundarias para mayor credibilidad",
    "No olvides revisar tesis doctorales recientes sobre tu tema"
  ],
  methodology: [
    "Define claramente tu enfoque: cualitativo, cuantitativo o mixto",
    "Especifica tu población y muestra de estudio",
    "Detalla los instrumentos de recolección de datos que utilizarás"
  ]
};

// Helper functions
export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem('investiflow_user')
  return userData ? JSON.parse(userData) : null
}

export const authenticateUser = (email: string, password: string): User | null => {
  // Simplified mock authentication - in real app this would be handled by the API
  const user = users.find(u => u.email === email)
  if (user && password === 'password123') { // Mock password check
    localStorage.setItem('investiflow_user', JSON.stringify(user))
    return user
  }
  return null
}

export const getUserProjects = (userId: number): Project[] => {
  return projects.filter(p => p.owner_id === userId)
}

export const getProjectTasks = (projectId: string): Task[] => {
  return tasks.filter(t => t.project_id === projectId)
}

export const getProjectById = (projectId: number): Project | undefined => {
  return projects.find(p => p.id === projectId)
}

export const createProject = (projectData: Partial<Project>): Project => {
  const newProject: Project = {
    id: Date.now(),
    name: projectData.name || '',
    description: projectData.description || '',
    owner_id: projectData.owner_id || 1,
    status: projectData.status || ProjectStatus.PLANNING,
    research_type: projectData.research_type || null,
    institution: projectData.institution || null,
    research_group: projectData.research_group || null,
    category: projectData.category || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  projects.push(newProject)
  return newProject
}

export const createTask = (taskData: Partial<Task>): Task => {
  const newTask: Task = {
    id: Date.now().toString(),
    project_id: taskData.project_id || '',
    phase_id: taskData.phase_id || '',
    title: taskData.title || '',
    created_by: taskData.created_by || '',
    created_at: new Date().toISOString(),
    order: tasks.filter(t => t.project_id === taskData.project_id && t.phase_id === taskData.phase_id).length,
    content_blocks: []
  }
  tasks.push(newTask)
  return newTask
}