from django.contrib import admin

from .models import ChatMessage, ChatThread


@admin.register(ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ["id", "user1", "user2", "updated_at"]


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ["id", "thread", "sender", "created_at"]
    search_fields = ["text"]