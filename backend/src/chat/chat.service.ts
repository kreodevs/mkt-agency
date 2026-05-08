import { Injectable } from '@nestjs/common';

export interface ChatMessage {
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

@Injectable()
export class ChatService {
  private sessions: Map<string, ChatMessage[]> = new Map();

  getMessages(sessionId: string): ChatMessage[] {
    return this.sessions.get(sessionId) || [];
  }

  addMessage(sessionId: string, role: 'user' | 'agent', content: string): ChatMessage {
    const message: ChatMessage = { role, content, timestamp: new Date() };
    const messages = this.sessions.get(sessionId) || [];
    messages.push(message);
    this.sessions.set(sessionId, messages);
    return message;
  }

  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}