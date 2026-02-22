from rest_framework import serializers

from categories.models import CategoryLevel2, CategoryLevel3
from categories.serializers import CategoryLevel1Serializer, CategoryLevel2Serializer, CategoryLevel3Serializer
from users.serializers import UserPublicSerializer

from .models import Listing, ListingBookmark, ListingImage


class ListingImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ListingImage
        fields = ["id", "image", "sort_order"]


class ListingSerializer(serializers.ModelSerializer):
    images = ListingImageSerializer(many=True, read_only=True)
    owner = UserPublicSerializer(read_only=True)
    category_level1 = CategoryLevel1Serializer(source="category_level2.parent", read_only=True)
    category_level2 = CategoryLevel2Serializer(read_only=True)
    category_level3 = CategoryLevel3Serializer(read_only=True)
    category_level2_id = serializers.PrimaryKeyRelatedField(
        queryset=CategoryLevel2.objects.all(), source="category_level2", write_only=True
    )
    category_level3_id = serializers.PrimaryKeyRelatedField(
        queryset=CategoryLevel3.objects.all(),
        source="category_level3",
        write_only=True,
        allow_null=True,
        required=False,
    )

    class Meta:
        model = Listing
        fields = [
            "id",
            "owner",
            "type",
            "title",
            "category_level1",
            "category_level2",
            "category_level3",
            "category_level2_id",
            "category_level3_id",
            "weight_value",
            "weight_unit",
            "price_value",
            "price_unit",
            "province",
            "city",
            "description",
            "status",
            "images",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["status", "created_at", "updated_at"]

    def validate(self, attrs):
        price_unit = attrs.get("price_unit")
        price_value = attrs.get("price_value")
        category_level2 = attrs.get("category_level2")
        category_level3 = attrs.get("category_level3")
        if price_unit == Listing.PriceUnit.NEGOTIABLE and price_value is not None:
            raise serializers.ValidationError("Price value must be empty when price is negotiable.")
        if price_unit != Listing.PriceUnit.NEGOTIABLE and price_value is None:
            raise serializers.ValidationError("Price value is required unless negotiable.")
        if category_level3 and category_level3.parent_id != category_level2.id:
            raise serializers.ValidationError("Selected level 3 does not belong to level 2.")
        return attrs


class ListingBookmarkSerializer(serializers.ModelSerializer):
    listing = ListingSerializer(read_only=True)
    listing_id = serializers.PrimaryKeyRelatedField(
        queryset=Listing.objects.all(), source="listing", write_only=True
    )

    class Meta:
        model = ListingBookmark
        fields = ["id", "listing", "listing_id", "created_at"]
        read_only_fields = ["created_at"]
