from django.urls import path

from .views import CityList, ProvinceList

urlpatterns = [
    path("provinces/", ProvinceList.as_view(), name="province-list"),
    path("cities/", CityList.as_view(), name="city-list"),
]
