from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import UntypedToken

from .models import ChatMessage, ChatThread

User = get_user_model()


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope["url_route"]["kwargs"]["thread_id"]
        token = parse_qs(self.scope.get("query_string", b"").decode()).get("token", [None])[0]
        if not token:
            await self.close()
            return
        try:
            validated = UntypedToken(token)
        except (InvalidToken, TokenError):
            await self.close()
            return
        user_id = validated.payload.get("user_id")
        self.user = await database_sync_to_async(User.objects.filter(id=user_id).first)()
        if not self.user:
            await self.close()
            return
        allowed = await self._is_user_in_thread(self.user.id, self.thread_id)
        if not allowed:
            await self.close()
            return
        self.group_name = f"chat_{self.thread_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, "group_name"):
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        text = content.get("text")
        if not text:
            return
        message = await self._create_message(self.thread_id, self.user.id, text)
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "chat.message",
                "message_id": message.id,
                "sender_id": self.user.id,
                "text": message.text,
                "created_at": message.created_at.isoformat(),
            },
        )

    async def chat_message(self, event):
        await self.send_json(event)

    @database_sync_to_async
    def _is_user_in_thread(self, user_id, thread_id):
        return ChatThread.objects.filter(id=thread_id).filter(user1_id=user_id).exists() or ChatThread.objects.filter(id=thread_id).filter(user2_id=user_id).exists()

    @database_sync_to_async
    def _create_message(self, thread_id, user_id, text):
        thread = ChatThread.objects.get(id=thread_id)
        return ChatMessage.objects.create(thread=thread, sender_id=user_id, text=text)
