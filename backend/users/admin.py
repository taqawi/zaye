from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["phone", "first_name", "last_name", "province", "city", "is_staff"]
    fieldsets = (
        (None, {"fields": ("phone", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "province", "city", "email", "landline")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": ("phone", "password1", "password2", "first_name", "last_name", "province", "city"),
            },
        ),
    )
    search_fields = ("phone", "first_name", "last_name")
    list_filter = ("is_staff", "is_active")
    filter_horizontal = ("groups", "user_permissions")