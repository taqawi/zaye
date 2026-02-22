from django.contrib.auth import get_user_model
from rest_framework import serializers

from listings.serializers import ListingImageSerializer
from users.serializers import UserPublicSerializer

from .models import ChatMessage, ChatThread


class ListingSummarySerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)

    class Meta:
        model = ChatThread.listing.field.related_model
        fields = ["id", "title", "images"]

User = get_user_model()


class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserPublicSerializer(read_only=True)
    text = serializers.CharField(allow_blank=True, required=False)

    class Meta:
        model = ChatMessage
        fields = ["id", "thread", "sender", "text", "file", "created_at"]
        read_only_fields = ["thread", "sender", "created_at"]

    def validate(self, attrs):
        text = attrs.get("text", "")
        file = attrs.get("file")
        if not text and not file:
            raise serializers.ValidationError("Message must include text or a file.")
        return attrs


class ChatThreadCreateSerializer(serializers.Serializer):
    other_user_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source="other_user")
    listing_id = serializers.PrimaryKeyRelatedField(
        queryset=ChatThread.listing.field.related_model.objects.all(),
        source="listing",
        allow_null=True,
        required=False,
    )

    def validate_other_user_id(self, value):
        request = self.context.get("request")
        if request and request.user == value:
            raise serializers.ValidationError("Cannot start a chat with yourself.")
        return value

    def validate(self, attrs):
        listing = attrs.get("listing")
        other_user = attrs.get("other_user")
        if listing and other_user and listing.owner_id != other_user.id:
            raise serializers.ValidationError("Selected listing does not belong to the other user.")
        return attrs


class ChatThreadSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    listing = ListingSummarySerializer(read_only=True)

    class Meta:
        model = ChatThread
        fields = ["id", "other_user", "listing", "last_message", "updated_at", "created_at"]

    def get_other_user(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return None
        other = obj.user2 if obj.user1_id == request.user.id else obj.user1
        return UserPublicSerializer(other).data

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if not last:
            return None
        return ChatMessageSerializer(last).data
