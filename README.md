# ضایع (Zaye) - MVP

این ریپو شامل بک‌اند جنگو (REST API) و فرانت جدید بر پایه Next.js است. نسخه قدیمی فرانت در پوشه `frontend` باقی مانده و نسخه جدید در `frontend-next` قرار دارد.

## Backend (Django + DRF)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\pip install -r requirements.txt
.\.venv\Scripts\python manage.py migrate
.\.venv\Scripts\python manage.py createsuperuser
.\.venv\Scripts\python manage.py runserver
```

API مستندات:
- `http://127.0.0.1:8000/api/docs/`

## Frontend جدید (Next.js)

```powershell
cd frontend-next
npm install
npm run dev
```

سپس:
- `http://127.0.0.1:5173/`

برای اتصال به بک‌اند لوکال، مقدار پیش‌فرض `http://127.0.0.1:8000/api` استفاده می‌شود. در صورت نیاز می‌توانید مقدار `NEXT_PUBLIC_API_BASE` را تنظیم کنید.

ایمپورت داده‌ها از ریپو (کلون شده در مسیر زیر):
python manage.py load_iran_locations --source c:/dev/scrap/.tmp-iran-cities/JSON/cities.json
python manage.py load_categories --source c:/dev/scrap/categories.json --reset


## ویژگی‌های پیاده‌سازی شده (MVP)
- ثبت‌نام با تلفن + رمز
- آگهی با تایید ادمین (pending/approved)
- دسته‌بندی سه سطحی
- فیلتر و جستجو
- چت ساده + WebSocket
- صفحه اختصاصی آگهی با اسلایدشو تصاویر
