import { Controller, Post, Get, Body, Param, UseGuards, Headers, Sse } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { SupabaseGuard } from '../auth/supabase.guard';
import { CurrentUser } from '@common/decorators/user.decorator';
import { Sse } from '@common/decorators/sse.decorator';
import { UserInfo } from '../auth/auth.service';
import { ChatService } from './chat.service';

@ApiTags('chat')
@Controller('chat')
@UseGuards(SupabaseGuard)
@ApiBearerAuth()
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  @ApiOperation({ summary: 'Send a chat message' })
  async chat(@CurrentUser() user: UserInfo, @Body() body: { message: string; threadId?: string }) {
    return this.chatService.chat(user.id, body.message, body.threadId);
  }

  @Post('stream')
  @Sse()
  @ApiOperation({ summary: 'Send a chat message with streaming response' })
  async chatStream(
    @CurrentUser() user: UserInfo,
    @Body() body: { message: string; threadId?: string },
  ): Observable<string> {
    return this.chatService.chatStream(user.id, body.message, body.threadId);
  }

  @Get('history/:threadId')
  @ApiOperation({ summary: 'Get chat history' })
  async getHistory(@CurrentUser() user: UserInfo, @Param('threadId') threadId: string) {
    return this.chatService.getHistory(user.id, threadId);
  }
}
