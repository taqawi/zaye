import django_filters
from django.db.models import Q

from .models import Listing


class ListingFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name="price_value", lookup_expr="gte")
    max_price = django_filters.NumberFilter(field_name="price_value", lookup_expr="lte")
    min_weight = django_filters.NumberFilter(field_name="weight_value", lookup_expr="gte")
    max_weight = django_filters.NumberFilter(field_name="weight_value", lookup_expr="lte")
    category_level1 = django_filters.NumberFilter(field_name="category_level2__parent_id")
    category_level2 = django_filters.NumberFilter(field_name="category_level2_id")
    category_level3 = django_filters.NumberFilter(field_name="category_level3_id")

    class Meta:
        model = Listing
        fields = [
            "type",
            "status",
            "province",
            "city",
            "price_unit",
            "weight_unit",
        ]

    def filter_queryset(self, queryset):
        queryset = super().filter_queryset(queryset)
        query = self.request.query_params.get("q")
        if query:
            queryset = queryset.filter(Q(title__icontains=query) | Q(description__icontains=query))
        return queryset
