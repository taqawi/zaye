from django.contrib import admin

from .models import City, Province


@admin.register(Province)
class ProvinceAdmin(admin.ModelAdmin):
    list_display = ["name", "external_id"]
    search_fields = ["name"]


@admin.register(City)
class CityAdmin(admin.ModelAdmin):
    list_display = ["name", "province", "external_id"]
    list_filter = ["province"]
    search_fields = ["name", "province__name"]
