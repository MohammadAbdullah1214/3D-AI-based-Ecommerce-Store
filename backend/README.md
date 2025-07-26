# 3D AI-Based E-Commerce Store  

## Table of Contents  
- [Getting Started](#getting-started)  
- [Prerequisites](#prerequisites)  
- [Project Setup](#project-setup)  
  - [1. Clone the Repository](#1-clone-the-repository)  
  - [2. Set Up Python Environment](#2-set-up-python-environment)  
  - [3. Database Setup](#3-database-setup)  
  - [4. Create Admin User](#4-create-admin-user)  
  - [5. Create Test Users (Optional)](#5-create-test-users-optional)  
  - [6. Run the Development Server](#6-run-the-development-server)  
- [Project Structure](#project-structure)  
- [Authorization System](#authorization-system)  
- [API Documentation](#api-documentation)  
- [Troubleshooting](#troubleshooting)  
- [License](#license)  


## Getting Started  
This project is a **3D AI-based e-commerce store** built with Django and Django REST Framework. It includes user authentication, role-based access control, and interactive 3D product viewing.  


## Prerequisites  
Ensure you have the following installed:  

- **Python** (Version 3.8 or later)
- **PostGRESQL** (For database setup Version 17 or later)
- **Git** (For cloning the repository)  
- **Virtual Environment (venv)** (For dependency management)  

---

## Project Setup  

### 1. Clone the Repository  

```bash
git clone https://github.com/MohammadAbdullah1214/3D-AI-based-Ecommerce-Store.git  
cd 3D-AI-based-Ecommerce-Store  
```

### 2. Create .ENV Files 
create a file in backend/ named .env and add this

```bash
DJANGO_SECRET_KEY=a9ogFLVgYPEHU-7yxnLbA07lJn1w613I7NxtTNwKq9J-SKof2Xot48NwQ5YFy2gQ850
DEBUG=False
DATABASE_URL=postgresql://postgres.gmxrvtrwjjiyvrqhwwmt:3dteam%40db123@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
ALLOWED_HOSTS=127.0.0.1,localhost,.vercel.app,.onrender.com
CELERY_BROKER_URL=rediss://default:Ab2XAAIjcDE1MzQ0Y2ZmOTM0MDg0ZTEyYTdhMjJmN2Y4YzRlNDQ4YXAxMA@special-leech-48535.upstash.io:6379
CELERY_RESULT_BACKEND=rediss://default:Ab2XAAIjcDE1MzQ0Y2ZmOTM0MDg0ZTEyYTdhMjJmN2Y4YzRlNDQ4YXAxMA@special-leech-48535.upstash.io:6379
SUPABASE_ACCESS_KEY=5d8689ca8f3c8604da224e762618e1a9
SUPABASE_SECRET_KEY=2389b2ebe67a1006e5fcc0f0b085daaeedd52d88d9590e1589df18ce294248e7
SUPABASE_PROJECT_REF=gmxrvtrwjjiyvrqhwwmt
SUPABASE_BUCKET=store-media
```

create a file in frontend/ named .env.local
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 2. Set Up Python Environment
```bash
Create and activate a virtual environment:

Remove-Item -Recurse -Force venv 
python -m venv venv  
venv\Scripts\activate  # For Windows
source venv/bin/activate  # For macOS/Linux  
  

Install dependencies from requirements.txt:
pip install -r requirements.txt  

If requirements.txt is not available, manually install the required packages:
pip install django djangorestframework djangorestframework-simplejwt drf-spectacular pillow psycopg psycopg2 django-allauth drf-spectacular djangorestframework-simplejwt django djangorestframework django-cors-headers django-environ environ  

del chatbot\ai_models\intent_classifier.pkl
   del chatbot\ai_models\vectorizer.pkl

   python manage.py shell

   from chatbot.ai_chatbot import AIChatbot
bot = AIChatbot()

### 3. Run the Development Server
```bash
python manage.py runserver  
Access the site at: http://127.0.0.1:8000/
```

Try logging in
```bash
admin account id : admin
admin account password : 1234
```

###  Project Structure
3D-AI-based-Ecommerce-Store/  
│── analytics/      # Analytics and dashboard functionality  
│── carts/          # Shopping cart implementation  
│── core/           # Main project settings  
│── orders/         # Order processing and management  
│── products/       # Product catalog with advanced 3D model generation  
│── users/          # User authentication and authorization  
│── db.sqlite3      # Database file (if using SQLite)  
│── manage.py       # Django project manager  
│── requirements.txt # Dependencies list  
└── README.md       # Project documentation
└── 3D_GENERATION_README.md # Detailed 3D generation documentation  

### Authorization System
The system supports role-based access control with different permissions:

#### Admin Role

    Manage all products, orders, and users

    Access all analytics and reports

#### Seller Role

    Create and manage own products

    View orders containing their products

    Access analytics for their products

    Limited access to customer features

#### Customer Role

    Browse products and view 3D models

    Add products to cart and wishlist

    Place and track orders

    Cannot access admin or seller features

### API Documentation
Once the server is running, access the API docs at:
http://127.0.0.1:8000/api/docs/

### Troubleshooting
Issue	Solution
Python not recognized	Ensure Python is added to your PATH
Package not found	Make sure your virtual environment is activated
Database errors	Delete db.sqlite3 and migrations folder (except __init__.py) and run migrations again
Permission issues	Run Command Prompt as Administrator

### License
This project is open-source and available under the MIT License.
