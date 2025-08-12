<template>
  <div class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
    <AppNavbar />
    
    <!-- Hero Section -->
    <section class="relative overflow-hidden py-20 sm:py-32">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <h1 class="text-4xl sm:text-6xl font-bold text-gray-900 mb-6">
            Gestiona tus proyectos de 
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-secondary-600">
              investigación
            </span>
            con IA
          </h1>
          <p class="text-xl text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
            InvestiFlow te ayuda a organizar, desarrollar y colaborar en proyectos de investigación 
            con la asistencia inteligente de Lexi, tu compañera de IA especializada en metodología científica.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <router-link 
              to="/register"
              class="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              Comenzar Gratis
            </router-link>
            <router-link 
              to="/login"
              class="bg-white hover:bg-gray-50 text-primary-600 px-8 py-3 rounded-lg font-semibold border-2 border-primary-600 transition-all duration-300"
            >
              Iniciar Sesión
            </router-link>
          </div>
        </div>
      </div>
      
      <!-- Floating Elements -->
      <div class="absolute top-20 left-10 animate-bounce-subtle">
        <div class="w-16 h-16 bg-primary-200 rounded-full opacity-60"></div>
      </div>
      <div class="absolute top-40 right-20 animate-bounce-subtle" style="animation-delay: 1s;">
        <div class="w-12 h-12 bg-secondary-200 rounded-full opacity-60"></div>
      </div>
    </section>
    
    <!-- Features Section -->
    <section class="py-20 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Conoce a Lexi, tu asistente de investigación
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Lexi utiliza inteligencia artificial para guiarte en cada etapa de tu proyecto de investigación
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="text-center p-6 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 hover:shadow-lg transition-all duration-300">
            <div class="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LightBulbIcon class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Ideación Inteligente</h3>
            <p class="text-gray-600">
              Lexi te ayuda a refinar tus ideas de investigación y definir alcances claros y viables.
            </p>
          </div>
          
          <div class="text-center p-6 rounded-xl bg-gradient-to-br from-secondary-50 to-secondary-100 hover:shadow-lg transition-all duration-300">
            <div class="w-16 h-16 bg-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Redacción Asistida</h3>
            <p class="text-gray-600">
              Recibe sugerencias para mejorar la redacción de objetivos, metodología y marco teórico.
            </p>
          </div>
          
          <div class="text-center p-6 rounded-xl bg-gradient-to-br from-accent-50 to-accent-100 hover:shadow-lg transition-all duration-300">
            <div class="w-16 h-16 bg-accent-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <AcademicCapIcon class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Bibliografía Inteligente</h3>
            <p class="text-gray-600">
              Encuentra fuentes relevantes y actualizadas para fortalecer tu marco teórico.
            </p>
          </div>
          
          <div class="text-center p-6 rounded-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300">
            <div class="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UsersIcon class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Colaboración Fluida</h3>
            <p class="text-gray-600">
              Trabaja en equipo con herramientas de colaboración en tiempo real.
            </p>
          </div>
          
          <div class="text-center p-6 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100 hover:shadow-lg transition-all duration-300">
            <div class="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChartBarIcon class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Seguimiento Visual</h3>
            <p class="text-gray-600">
              Organiza tu proyecto en fases con un tablero visual tipo Kanban.
            </p>
          </div>
          
          <div class="text-center p-6 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300">
            <div class="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <SparklesIcon class="w-8 h-8 text-white" />
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">IA Especializada</h3>
            <p class="text-gray-600">
              Algoritmos entrenados específicamente en metodología de investigación científica.
            </p>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Lexi Introduction -->
    <section class="py-20 bg-gradient-to-r from-secondary-100 to-primary-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col lg:flex-row items-center gap-12">
          <div class="lg:w-1/2">
            <div class="relative">
              <div class="w-64 h-64 mx-auto bg-gradient-to-br from-secondary-400 to-accent-500 rounded-full flex items-center justify-center shadow-2xl">
                <div class="w-32 h-32 text-white animate-bounce-subtle">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                </div>
              </div>
              <div class="absolute -top-4 -right-4 w-8 h-8 bg-green-400 rounded-full border-4 border-white animate-pulse"></div>
            </div>
          </div>
          <div class="lg:w-1/2">
            <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Conoce a Lexi
            </h2>
            <p class="text-lg text-gray-700 mb-6 leading-relaxed">
              Lexi es más que un chatbot: es tu compañera inteligente especializada en investigación académica. 
              Con conocimientos profundos en metodología científica, te acompaña desde la conceptualización 
              hasta la redacción final de tu proyecto.
            </p>
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <CheckCircleIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-700">Experta en metodología de investigación</span>
              </div>
              <div class="flex items-start space-x-3">
                <CheckCircleIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-700">Disponible 24/7 para resolver tus dudas</span>
              </div>
              <div class="flex items-start space-x-3">
                <CheckCircleIcon class="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <span class="text-gray-700">Sugerencias personalizadas para tu área de estudio</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <!-- Pricing Preview Section -->
    <section class="py-20 bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Planes diseñados para cada investigador
          </h2>
          <p class="text-lg text-gray-600 max-w-2xl mx-auto">
            Desde estudiantes hasta investigadores senior, tenemos el plan perfecto para tu nivel de investigación
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Plan Gratuito -->
          <div class="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div class="text-center">
              <h3 class="text-2xl font-bold text-gray-900 mb-4">Estudiante</h3>
              <div class="mb-6">
                <span class="text-4xl font-bold text-primary-600">Gratis</span>
                <span class="text-gray-600">/siempre</span>
              </div>
              <ul class="text-left space-y-3 mb-8">
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>1 proyecto activo</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Acceso básico a Lexi</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Tablero Kanban completo</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Soporte por email</span>
                </li>
              </ul>
              <button class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Comenzar Gratis
              </button>
            </div>
          </div>
          
          <!-- Plan Pro -->
          <div class="bg-white p-8 rounded-xl shadow-lg border-2 border-primary-500 hover:shadow-xl transition-all duration-300 relative">
            <div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span class="bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-semibold">Más Popular</span>
            </div>
            <div class="text-center">
              <h3 class="text-2xl font-bold text-gray-900 mb-4">Investigador</h3>
              <div class="mb-6">
                <span class="text-4xl font-bold text-primary-600">$9.99</span>
                <span class="text-gray-600">/mes</span>
              </div>
              <ul class="text-left space-y-3 mb-8">
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Proyectos ilimitados</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Lexi Pro con IA avanzada</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Búsqueda bibliográfica</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Colaboración en tiempo real</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Exportación avanzada</span>
                </li>
              </ul>
              <button class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Próximamente
              </button>
            </div>
          </div>
          
          <!-- Plan Institucional -->
          <div class="bg-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
            <div class="text-center">
              <h3 class="text-2xl font-bold text-gray-900 mb-4">Institucional</h3>
              <div class="mb-6">
                <span class="text-4xl font-bold text-primary-600">$29.99</span>
                <span class="text-gray-600">/mes</span>
              </div>
              <ul class="text-left space-y-3 mb-8">
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Todo lo del plan Pro</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Hasta 50 usuarios</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Dashboard administrativo</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Soporte prioritario</span>
                </li>
                <li class="flex items-center">
                  <CheckCircleIcon class="w-5 h-5 text-green-500 mr-3" />
                  <span>Branding personalizado</span>
                </li>
              </ul>
              <button class="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors">
                Próximamente
              </button>
            </div>
          </div>
        </div>
        
        <div class="text-center mt-12">
          <p class="text-gray-600 mb-4">
            ¿Tienes necesidades específicas? Contáctanos para un plan personalizado.
          </p>
          <button class="text-primary-600 font-semibold hover:text-primary-700 transition-colors">
            Hablar con ventas →
          </button>
        </div>
      </div>
    </section>
    
    <!-- CTA Section -->
    <section class="py-20 bg-primary-600">
      <div class="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
        <h2 class="text-3xl sm:text-4xl font-bold text-white mb-6">
          Revoluciona tu manera de investigar
        </h2>
        <p class="text-xl text-primary-100 mb-8">
          Únete a miles de investigadores que ya confían en InvestiFlow para sus proyectos académicos.
        </p>
        <router-link 
          to="/register"
          class="bg-white hover:bg-gray-100 text-primary-600 px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 transform hover:scale-105 shadow-lg inline-block"
        >
          Comenzar mi Proyecto Gratis
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import AppNavbar from '../components/layout/AppNavbar.vue'
import { 
  LightBulbIcon, 
  DocumentTextIcon, 
  AcademicCapIcon, 
  UsersIcon, 
  ChartBarIcon, 
  SparklesIcon,
  CheckCircleIcon 
} from '@heroicons/vue/24/outline'
</script>