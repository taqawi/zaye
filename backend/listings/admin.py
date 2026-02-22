from django.contrib import admin

from .models import Listing, ListingBookmark, ListingImage


class ListingImageInline(admin.TabularInline):
    model = ListingImage
    extra = 0


@admin.register(Listing)
class ListingAdmin(admin.ModelAdmin):
    list_display = ["title", "type", "status", "owner", "category_level2", "category_level3", "province", "city", "created_at"]
    list_filter = ["status", "type", "province"]
    search_fields = ["title", "description"]
    inlines = [ListingImageInline]


@admin.register(ListingImage)
class ListingImageAdmin(admin.ModelAdmin):
    list_display = ["listing", "sort_order"]


@admin.register(ListingBookmark)
class ListingBookmarkAdmin(admin.ModelAdmin):
    list_display = ["user", "listing", "created_at"]
    search_fields = ["user__phone", "listing__title"]
