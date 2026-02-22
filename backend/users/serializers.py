from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class UserPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "province", "city"]


class UserContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["phone", "email", "landline"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = User
        fields = [
            "phone",
            "password",
            "first_name",
            "last_name",
            "province",
            "city",
            "email",
            "landline",
        ]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(password=password, **validated_data)
        return user