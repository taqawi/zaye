from rest_framework import serializers

from .models import CategoryLevel1, CategoryLevel2, CategoryLevel3


class CategoryLevel1Serializer(serializers.ModelSerializer):
    has_children = serializers.BooleanField(read_only=True)

    class Meta:
        model = CategoryLevel1
        fields = ["id", "name", "slug", "icon_svg", "has_children"]


class CategoryLevel2Serializer(serializers.ModelSerializer):
    has_children = serializers.BooleanField(read_only=True)

    class Meta:
        model = CategoryLevel2
        fields = ["id", "name", "slug", "parent", "has_children"]


class CategoryLevel3Serializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryLevel3
        fields = ["id", "name", "slug", "parent"]
