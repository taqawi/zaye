from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from rest_framework.response import Response
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from .models import ChatMessage, ChatThread
from .serializers import ChatMessageSerializer, ChatThreadCreateSerializer, ChatThreadSerializer


class ChatThreadViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        return (
            ChatThread.objects.filter(Q(user1=user) | Q(user2=user))
            .select_related("listing", "user1", "user2")
            .prefetch_related("messages", "listing__images")
        )

    def get_serializer_class(self):
        if self.action == "create":
            return ChatThreadCreateSerializer
        return ChatThreadSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        other_user = serializer.validated_data["other_user"]
        listing = serializer.validated_data.get("listing")
        user1, user2 = (request.user, other_user) if request.user.id < other_user.id else (other_user, request.user)
        thread, created = ChatThread.objects.get_or_create(user1=user1, user2=user2, listing=listing)
        output = ChatThreadSerializer(thread, context={"request": request})
        return Response(output.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=True, methods=["get", "post"], parser_classes=[JSONParser, MultiPartParser, FormParser])
    def messages(self, request, pk=None):
        thread = self.get_object()
        if request.method == "GET":
            serializer = ChatMessageSerializer(thread.messages.select_related("sender"), many=True)
            return Response(serializer.data)
        serializer = ChatMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = ChatMessage.objects.create(
            thread=thread,
            sender=request.user,
            text=serializer.validated_data.get("text", ""),
            file=serializer.validated_data.get("file"),
        )
        output = ChatMessageSerializer(message)
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            f"chat_{thread.id}",
            {
                "type": "chat.message",
                "message_id": message.id,
                "sender_id": request.user.id,
                "text": message.text,
                "file": output.data.get("file"),
                "created_at": message.created_at.isoformat(),
            },
        )
        return Response(output.data, status=status.HTTP_201_CREATED)
