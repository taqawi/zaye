import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from categories.models import CategoryLevel1, CategoryLevel2, CategoryLevel3


class Command(BaseCommand):
    help = "Load categories (3 levels) from a JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default="c:/dev/scrap/categories.json",
            help="Path to categories.json",
        )
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing categories before import.",
        )

    def handle(self, *args, **options):
        source = Path(options["source"])
        if not source.exists():
            self.stderr.write(f"Source file not found: {source}")
            return

        raw = source.read_text(encoding="utf-8")
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            raw = source.read_text(encoding="cp1256")
            data = json.loads(raw)

        items = data.get("categories") if isinstance(data, dict) else None
        if not items:
            self.stderr.write("Unexpected JSON format. Expected {'categories': [...]}.")
            return

        def should_skip(name: str) -> bool:
            name = (name or "").strip()
            return name.startswith("همه ")

        with transaction.atomic():
            if options["reset"]:
                CategoryLevel3.objects.all().delete()
                CategoryLevel2.objects.all().delete()
                CategoryLevel1.objects.all().delete()

            for level1 in items:
                level1_name = (level1.get("name") or "").strip()
                if not level1_name:
                    continue
                level1_obj, _ = CategoryLevel1.objects.get_or_create(
                    name=level1_name,
                    defaults={"slug": slugify(level1_name, allow_unicode=True)},
                )

                for level2 in level1.get("subcategories", []) or []:
                    level2_name = (level2.get("name") or "").strip()
                    if not level2_name:
                        continue
                    level2_obj, _ = CategoryLevel2.objects.get_or_create(
                        parent=level1_obj,
                        slug=slugify(level2_name, allow_unicode=True),
                        defaults={"name": level2_name},
                    )

                    for item in level2.get("items", []) or []:
                        item_name = (item or "").strip()
                        if not item_name or should_skip(item_name):
                            continue
                        CategoryLevel3.objects.get_or_create(
                            parent=level2_obj,
                            slug=slugify(item_name, allow_unicode=True),
                            defaults={"name": item_name},
                        )

        self.stdout.write(self.style.SUCCESS("Categories imported successfully."))
