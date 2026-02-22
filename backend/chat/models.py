from django.conf import settings
from django.db import models


class ChatThread(models.Model):
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="threads_as_user1")
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="threads_as_user2")
    listing = models.ForeignKey(
        "listings.Listing",
        on_delete=models.SET_NULL,
        related_name="chat_threads",
        null=True,
        blank=True,
    )
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user1", "user2", "listing"], name="uniq_thread_user_pair_listing"),
        ]

    def save(self, *args, **kwargs):
        if self.user1_id and self.user2_id and self.user1_id > self.user2_id:
            self.user1_id, self.user2_id = self.user2_id, self.user1_id
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"Thread {self.id}"


class ChatMessage(models.Model):
    thread = models.ForeignKey(ChatThread, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    text = models.TextField(blank=True)
    file = models.FileField(upload_to="chat/attachments/", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self) -> str:
        return f"Message {self.id}"
