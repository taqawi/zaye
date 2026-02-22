from django.db.models import Exists, OuterRef
from rest_framework import generics, permissions

from .models import CategoryLevel1, CategoryLevel2, CategoryLevel3
from .serializers import CategoryLevel1Serializer, CategoryLevel2Serializer, CategoryLevel3Serializer


class CategoryLevel1List(generics.ListAPIView):
    queryset = CategoryLevel1.objects.annotate(
        has_children=Exists(CategoryLevel2.objects.filter(parent_id=OuterRef("pk")))
    ).order_by("name")
    serializer_class = CategoryLevel1Serializer
    permission_classes = [permissions.AllowAny]


class CategoryLevel2List(generics.ListAPIView):
    serializer_class = CategoryLevel2Serializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = CategoryLevel2.objects.annotate(
            has_children=Exists(CategoryLevel3.objects.filter(parent_id=OuterRef("pk")))
        ).order_by("name")
        parent_id = self.request.query_params.get("parent")
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        return queryset


class CategoryLevel3List(generics.ListAPIView):
    serializer_class = CategoryLevel3Serializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = CategoryLevel3.objects.all().order_by("name")
        parent_id = self.request.query_params.get("parent")
        if parent_id:
            queryset = queryset.filter(parent_id=parent_id)
        return queryset
