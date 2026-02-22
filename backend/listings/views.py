from django.db.models import Q
from rest_framework import mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from users.serializers import UserContactSerializer

from .filters import ListingFilter
from .models import Listing, ListingImage
from .permissions import IsOwnerOrStaff
from .serializers import ListingBookmarkSerializer, ListingImageSerializer, ListingSerializer


class ListingViewSet(viewsets.ModelViewSet):
    serializer_class = ListingSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    filterset_class = ListingFilter
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "price_value", "weight_value"]

    def get_queryset(self):
        queryset = (
            Listing.objects.select_related(
                "owner",
                "category_level2",
                "category_level2__parent",
                "category_level3",
            )
            .prefetch_related("images")
            .all()
        )
        user = self.request.user
        if user.is_authenticated and user.is_staff:
            return queryset
        if user.is_authenticated:
            return queryset.filter(Q(status=Listing.Status.APPROVED) | Q(owner=user))
        return queryset.filter(status=Listing.Status.APPROVED)

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy"]:
            return [permissions.IsAuthenticated(), IsOwnerOrStaff()]
        if self.action in ["approve", "reject"]:
            return [permissions.IsAdminUser()]
        return super().get_permissions()

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser, FormParser])
    def images(self, request, pk=None):
        listing = self.get_object()
        if not (request.user.is_staff or listing.owner_id == request.user.id):
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ListingImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(listing=listing)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def contact(self, request, pk=None):
        listing = self.get_object()
        serializer = UserContactSerializer(listing.owner)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def approve(self, request, pk=None):
        listing = self.get_object()
        listing.status = Listing.Status.APPROVED
        listing.save(update_fields=["status"])
        return Response({"status": listing.status})

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAdminUser])
    def reject(self, request, pk=None):
        listing = self.get_object()
        listing.status = Listing.Status.REJECTED
        listing.save(update_fields=["status"])
        return Response({"status": listing.status})


class ListingBookmarkViewSet(
    mixins.ListModelMixin,
    mixins.CreateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = ListingBookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return (
            ListingBookmarkSerializer.Meta.model.objects
            .filter(user=self.request.user)
            .select_related("listing", "listing__owner", "listing__category_level2", "listing__category_level2__parent", "listing__category_level3")
            .prefetch_related("listing__images")
            .order_by("-created_at")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        listing = serializer.validated_data["listing"]
        bookmark, created = ListingBookmarkSerializer.Meta.model.objects.get_or_create(
            user=request.user,
            listing=listing,
        )
        output = self.get_serializer(bookmark)
        status_code = status.HTTP_201_CREATED if created else status.HTTP_200_OK
        return Response(output.data, status=status_code)
