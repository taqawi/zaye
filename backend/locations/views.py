from rest_framework import generics, permissions

from .models import City, Province
from .serializers import CitySerializer, ProvinceSerializer


class ProvinceList(generics.ListAPIView):
    serializer_class = ProvinceSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = Province.objects.all().order_by("name")
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)
        return qs


class CityList(generics.ListAPIView):
    serializer_class = CitySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        qs = City.objects.select_related("province").all().order_by("name")
        province_id = self.request.query_params.get("province")
        if province_id:
            qs = qs.filter(province_id=province_id)
        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(name__icontains=q)
        return qs
