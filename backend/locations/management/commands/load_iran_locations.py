import json
from pathlib import Path

from django.core.management.base import BaseCommand
from django.db import transaction

from locations.models import City, Province


class Command(BaseCommand):
    help = "Load Iran provinces and cities from a JSON file."

    def add_arguments(self, parser):
        parser.add_argument(
            "--source",
            default="c:/dev/scrap/.tmp-iran-cities/JSON/cities.json",
            help="Path to cities.json from Iran-Cities-Data repo.",
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

        if not isinstance(data, list):
            self.stderr.write("Unexpected JSON format. Expected a list of provinces.")
            return

        with transaction.atomic():
            City.objects.all().delete()
            Province.objects.all().delete()

            provinces = []
            for item in data:
                provinces.append(
                    Province(
                        name=item["name"].strip(),
                        external_id=int(item["id"]),
                    )
                )
            Province.objects.bulk_create(provinces)

            province_map = {p.external_id: p for p in Province.objects.all()}
            cities = []
            for item in data:
                province = province_map.get(int(item["id"]))
                for city in item.get("cities", []):
                    cities.append(
                        City(
                            province=province,
                            name=city["name"].strip(),
                            external_id=int(city["id"]),
                        )
                    )
            City.objects.bulk_create(cities)

        self.stdout.write(self.style.SUCCESS("Locations imported successfully."))
