from django.contrib import admin

from .models import CategoryLevel1, CategoryLevel2, CategoryLevel3


@admin.register(CategoryLevel1)
class CategoryLevel1Admin(admin.ModelAdmin):
    list_display = ["name", "slug", "icon_svg"]
    search_fields = ["name", "slug"]


@admin.register(CategoryLevel2)
class CategoryLevel2Admin(admin.ModelAdmin):
    list_display = ["name", "parent", "slug"]
    list_filter = ["parent"]
    search_fields = ["name", "slug"]


@admin.register(CategoryLevel3)
class CategoryLevel3Admin(admin.ModelAdmin):
    list_display = ["name", "parent", "slug"]
    list_filter = ["parent"]
    search_fields = ["name", "slug"]
