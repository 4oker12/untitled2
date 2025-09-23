// src/modules/friends.controller.ts
import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiCookieAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FriendsService } from './friends.service.js';

@ApiTags('friends')
@ApiCookieAuth('access_token')
@Controller('friends')
export class FriendsController {
  constructor(private readonly service: FriendsService) {}

  @Get()
  @ApiResponse({ status: 200 })
  listFriends() {
    // [FIX] раньше: this.service.listFriends(req, res);
    return this.service.listFriends();
  }

  @Get('requests')
  @ApiResponse({ status: 200 })
  listRequests(@Query('type') type?: 'incoming' | 'outgoing') {
    // [FIX] раньше: this.service.listRequests(req, res, type);
    return this.service.listRequests(type);
  }

  @Post('requests')
  @ApiResponse({ status: 201 })
  sendRequest(@Body() body: { toHandle: string }) {
    // [FIX] раньше: this.service.sendRequest(req, res, body?.toHandle);
    return this.service.sendRequest({ toHandle: body?.toHandle });
  }

  @Post('requests/:id/accept')
  accept(@Param('id') id: string) {
    // [FIX] раньше: this.service.accept(...)
    return this.service.acceptRequest(id);
  }

  @Post('requests/:id/decline')
  decline(@Param('id') id: string) {
    // [FIX] раньше: this.service.decline(...)
    return this.service.declineRequest(id);
  }

  @Post('requests/:id/cancel')
  cancel(@Param('id') id: string) {
    // [FIX] раньше: this.service.cancel(...)
    return this.service.cancelRequest(id);
  }

  @Delete(':userId')
  remove(@Param('userId') userId: string) {
    // [FIX] раньше: this.service.remove(...)
    return this.service.removeFriend(userId);
  }

  @Get('/search/users')
  searchUsers(@Query('q') q: string) {
    // [FIX] раньше: this.service.searchUsers(req, res, search);
    return this.service.searchUsers(q);
  }
}
