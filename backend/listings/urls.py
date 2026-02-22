from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ListingBookmarkViewSet, ListingViewSet

router = DefaultRouter()
router.register(r"", ListingViewSet, basename="listing")
router.register(r"bookmarks", ListingBookmarkViewSet, basename="bookmark")

urlpatterns = [
    path("", include(router.urls)),
]
