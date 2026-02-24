from django.db import models


class CategoryLevel1(models.Model):
    name = models.CharField(max_length=200, unique=True)
    slug = models.SlugField(max_length=220, unique=True, allow_unicode=True)
    icon_svg = models.TextField(blank=True, default="")

    class Meta:
        verbose_name = "Category Level 1"
        verbose_name_plural = "Categories Level 1"

    def __str__(self) -> str:
        return self.name


class CategoryLevel2(models.Model):
    parent = models.ForeignKey(CategoryLevel1, on_delete=models.CASCADE, related_name="level2")
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, allow_unicode=True)

    class Meta:
        verbose_name = "Category Level 2"
        verbose_name_plural = "Categories Level 2"
        constraints = [
            models.UniqueConstraint(fields=["parent", "slug"], name="uniq_level2_parent_slug"),
        ]

    def __str__(self) -> str:
        return f"{self.parent.name} / {self.name}"


class CategoryLevel3(models.Model):
    parent = models.ForeignKey(CategoryLevel2, on_delete=models.CASCADE, related_name="level3")
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, allow_unicode=True)

    class Meta:
        verbose_name = "Category Level 3"
        verbose_name_plural = "Categories Level 3"
        constraints = [
            models.UniqueConstraint(fields=["parent", "slug"], name="uniq_level3_parent_slug"),
        ]

    def __str__(self) -> str:
        return f"{self.parent.parent.name} / {self.parent.name} / {self.name}"
