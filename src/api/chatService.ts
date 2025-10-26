import apiClient from './client'
import type { Conversation, ConversationListItem, ChatRequest, ChatResponse } from '../types'

export const chatService = {
  /**
   * Obtiene todas las conversaciones de un proyecto
   */
  async getConversations(projectId: number): Promise<ConversationListItem[]> {
    const response = await apiClient.get(`/ia/proyectos/${projectId}/conversaciones`)
    return response.data
  },

  /**
   * Obtiene una conversación específica con todos sus mensajes
   */
  async getConversation(projectId: number, conversationId: number): Promise<Conversation> {
    const response = await apiClient.get(`/ia/proyectos/${projectId}/conversaciones/${conversationId}`)
    return response.data
  },

  /**
   * Envía un mensaje al chat (crea conversación automáticamente si no existe)
   */
  async sendMessage(projectId: number, data: ChatRequest): Promise<ChatResponse> {
    const response = await apiClient.post(`/ia/proyectos/${projectId}/chat`, data)
    return response.data
  },

  /**
   * Actualiza el título de una conversación
   */
  async updateConversationTitle(
    projectId: number,
    conversationId: number,
    title: string
  ): Promise<Conversation> {
    const response = await apiClient.patch(
      `/ia/proyectos/${projectId}/conversaciones/${conversationId}`,
      { title }
    )
    return response.data
  },

  /**
   * Elimina una conversación
   */
  async deleteConversation(projectId: number, conversationId: number): Promise<void> {
    await apiClient.delete(`/ia/proyectos/${projectId}/conversaciones/${conversationId}`)
  }
}
