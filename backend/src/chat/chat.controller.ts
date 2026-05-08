import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ChatService } from './chat.service';

@Controller('tenants/:tenantId/chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get(':sessionId')
  getMessages(@Param('sessionId') sessionId: string) {
    return this.chatService.getMessages(sessionId);
  }

  @Post(':sessionId')
  sendMessage(@Param('sessionId') sessionId: string, @Body('content') content: string) {
    const userMsg = this.chatService.addMessage(sessionId, 'user', content);
    return { userMsg, reply: 'Mensaje recibido. Hermes procesará tu solicitud.' };
  }

  @Delete(':sessionId')
  clearSession(@Param('sessionId') sessionId: string) {
    this.chatService.clearSession(sessionId);
    return { ok: true };
  }
}
