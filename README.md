# InvestiFlow - Plataforma de Gestión de Proyectos de Investigación

## 🔬 Descripción

InvestiFlow es una plataforma web innovadora diseñada para transformar la manera en que estudiantes, investigadores y académicos gestionan sus proyectos. A través de una interfaz interactiva tipo Kanban y la integración de **Lexi** (nuestro asistente de IA especializado impulsado por Google Gemini), InvestiFlow no solo ayuda a organizar el ciclo de vida completo de la investigación, sino que brinda orientación en tiempo real, desde el desarrollo metodológico hasta la generación automatizada de bibliografía.

🚀 **¡Prueba la plataforma en vivo!** [https://investi-flow.netlify.app/](https://investi-flow.netlify.app/)

## ✨ Características Principales

### 🤖 Asistente de IA - Lexi (Google Gemini)
- **Contexto Persistente**: Lexi mantiene el contexto completo del proyecto a través de todas las fases.
- **Asistencia Especializada**: Entrenada específicamente en metodología de investigación científica.
- **Búsqueda Bibliográfica Automatizada**: Generación sugerida e inteligente de recursos bibliográficos.
- **Disponibilidad 24/7**: Siempre disponible para resolver dudas, redactar y ofrecer orientación.

### 📋 Gestión de Proyectos y Tareas 
- **Tablero Kanban Visual**: Organización intuitiva del flujo de trabajo con *Drag & Drop*.
- **Fases del Ciclo de Vida**: Idea, Planteamiento del Problema, Marco Teórico, Metodología, Resultados y Conclusiones.
- **Seguimiento de Progreso**: Visualización clara del avance del proyecto y métricas básicas.

### 📄 Gestión Avanzada de Documentos
- **Editor de Documentos Integrado**: Edita y guarda contenido enriquecido directamente en tus tareas.
- **Anexos Múltiples**: Capacidad de adjuntar, descargar y gestionar documentos (por ejemplo `.docx`) a nivel de Proyecto, Fase y Tarea.

### 👥 Autenticación y Seguridad
- **Sistema de Autenticación JWT**: Registro, inicio de sesión y validación de tokens seguros conectados a nuestra API en FastAPI.
- **Perfiles de Usuario**: Gestión segura y privada de tu información.

### 🎨 Interfaz Moderna
- **Diseño Responsive**: Optimizado para desktop, tablet y móvil.
- **UI/UX Intuitiva**: Interfaz limpia construida con TailwindCSS, animaciones suaves y feedback visual atractivo.

## 🛠️ Tecnologías

### Frontend
- **Vue.js 3** (Composition API) + **TypeScript**
- **TailwindCSS** + **HeroIcons**
- **Vue Router** (Enrutamiento SPA)
- **Pinia** (Gestión de estado)
- **Vite** (Build tool y dev server)

### Backend y Base de Datos
- **FastAPI**: API REST rápida y eficiente en Python.
- **PostgreSQL**: Base de datos relacional para almacenamiento persistente y estructurado.
- **Alembic**: Migraciones de base de datos.
- **Integraciones**: SDK de Google Gemini para procesamiento de LLMs.

## 📁 Estructura del Proyecto Frontend

```
src/
├── components/          # Componentes reutilizables (layout, ui, editor, etc.)
├── views/             # Páginas principales
├── stores/            # Gestión de estado (Pinia)
├── router/            # Configuración de rutas
├── data/              # Datos mock y tipos
├── types/             # Definiciones TypeScript
├── lib/               # Utilidades y API services
└── assets/            # Recursos estáticos
```

## 🚀 Instalación y Desarrollo (Frontend)

### Prerequisitos
- Node.js 18+ 
- npm (incluido con Node.js)

### Configuración Inicial

```bash
# Clonar el repositorio
git clone <repository-url>
cd investi-flow-frontend

# Configurar variables de entorno
cp .env.example .env
# IMPORTANTE: Configura las variables como la URL del API dentro de .env

# Instalar dependencias
npm install
```

### Scripts Disponibles

```bash
# Servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Type checking
npm run type-check
```

## 📊 Estado Actual

### ✅ Implementado
- Frontend completo con Vue 3 + TypeScript.
- Backend escalable con FastAPI y PostgreSQL.
- Autenticación de seguridad mediante JWT.
- Integración completa con la API de Google Gemini para el asistente Lexi.
- Búsqueda y generación de bibliografía automatizada por IA.
- Gestión de proyectos (Tableros, Fases y Tareas).
- Inserción y edición de documentos (`.docx`), incluyendo descargas directas en la web.
- Interfaz UI/UX moderna, enrutamiento y gestión de estado reactivos.

### 📋 Planificado / Funcionalidades Futuras
- **Integración con Bases de Datos Científicas**: Conexión con plataformas de pago como Scopus o Web of Science para proporcionar referencias de la más alta calidad y rigor académico.
- **Colaboración en Tiempo Real**: Edición sincronizada entre múltiples usuarios simultáneamente.
- **Sistema de Comentarios**: Intercambio de feedback y revisión entre colaboradores del proyecto.
- **Monetización**: Sistema de *Pricing* con roles, planes gratuitos y premium (pagos).
- **Métricas y Analytics**: Dashboard avanzado de progreso y estadísticas detalladas por usuario.
- **Generación de Informes**: Exportación de resultados finales en formatos institucionales (PDF completo).

## 🎯 Objetivos del Proyecto

1. **Simplificar el proceso de investigación** mediante herramientas centralizadas.
2. **Democratizar el acceso a recursos académicos** con asistencia estructurada de Inteligencia Artificial.
3. **Optimizar el flujo de trabajo**, mejorando los tiempos de estructuración.
4. **Mantener altos estándares éticos** en el uso responsable de IA para la academia.

## 🤝 Contribución

Este proyecto está en desarrollo activo. Las contribuciones son bienvenidas siguiendo las mejores prácticas de desarrollo y manteniendo la consistencia con TypeScript y los estándares de código de Vue 3.

## 📄 Licencia

[Por especificar]

---

**InvestiFlow** - Revolucionando la manera de hacer investigación académica con Inteligencia Artificial. 🚀
