from django.db import models


class Province(models.Model):
    name = models.CharField(max_length=120, unique=True)
    external_id = models.PositiveIntegerField(unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class City(models.Model):
    province = models.ForeignKey(Province, on_delete=models.CASCADE, related_name="cities")
    name = models.CharField(max_length=120)
    external_id = models.PositiveIntegerField()

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(fields=["province", "name"], name="uniq_city_province_name"),
            models.UniqueConstraint(fields=["province", "external_id"], name="uniq_city_province_external_id"),
        ]

    def __str__(self) -> str:
        return f"{self.province.name} - {self.name}"
