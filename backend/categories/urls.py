from django.urls import path

from .views import CategoryLevel1List, CategoryLevel2List, CategoryLevel3List

urlpatterns = [
    path("level1/", CategoryLevel1List.as_view(), name="category-level1"),
    path("level2/", CategoryLevel2List.as_view(), name="category-level2"),
    path("level3/", CategoryLevel3List.as_view(), name="category-level3"),
]