from django.conf import settings
from django.db import models

from categories.models import CategoryLevel2, CategoryLevel3


class Listing(models.Model):
    class ListingType(models.TextChoices):
        BUY = "buy", "Buy"
        SELL = "sell", "Sell"

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        REJECTED = "rejected", "Rejected"
        ARCHIVED = "archived", "Archived"

    class WeightUnit(models.TextChoices):
        TON = "ton", "Ton"
        KG = "kg", "Kilogram"
        PIECE = "piece", "Piece"

    class PriceUnit(models.TextChoices):
        TOMAN_PER_TON = "toman_per_ton", "Toman per ton"
        TOMAN_PER_KG = "toman_per_kg", "Toman per kg"
        TOMAN_PER_PIECE = "toman_per_piece", "Toman per piece"
        TOMAN_PER_AMPERE = "toman_per_ampere", "Toman per ampere"
        NEGOTIABLE = "negotiable", "Negotiable"

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="listings")
    type = models.CharField(max_length=10, choices=ListingType.choices)
    title = models.CharField(max_length=200)
    category_level2 = models.ForeignKey(CategoryLevel2, on_delete=models.PROTECT, related_name="listings")
    category_level3 = models.ForeignKey(
        CategoryLevel3, on_delete=models.PROTECT, related_name="listings", null=True, blank=True
    )
    weight_value = models.DecimalField(max_digits=12, decimal_places=3)
    weight_unit = models.CharField(max_length=20, choices=WeightUnit.choices)
    price_value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True)
    price_unit = models.CharField(max_length=30, choices=PriceUnit.choices)
    province = models.CharField(max_length=120)
    city = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.title} ({self.get_type_display()})"


class ListingImage(models.Model):
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="listings/")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"Image for {self.listing_id}"


class ListingBookmark(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="bookmarks")
    listing = models.ForeignKey(Listing, on_delete=models.CASCADE, related_name="bookmarked_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user", "listing"], name="uniq_user_listing_bookmark"),
        ]

    def __str__(self) -> str:
        return f"Bookmark {self.user_id} -> {self.listing_id}"
