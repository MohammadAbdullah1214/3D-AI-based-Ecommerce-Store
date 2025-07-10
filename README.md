# Merged E-Commerce Platform

A comprehensive e-commerce platform that combines advanced AI chatbot functionality with 3D product visualization capabilities.

## 🚀 Features

### Core E-Commerce
- **User Management:** Authentication, authorization, profiles
- **Product Management:** CRUD operations, categories, inventory
- **Shopping Experience:** Cart, checkout, order tracking
- **Payment Processing:** Secure payment integration
- **Analytics:** Sales reports, user behavior tracking

### 🤖 AI Chatbot (from latest2)
- **Natural Language Processing:** Advanced NLP with transformers
- **Product Recommendations:** AI-powered product suggestions
- **Customer Support:** Automated customer service
- **Behavior Tracking:** User interaction analytics
- **Smart Responses:** Context-aware conversations

### 🎨 3D Visualization (from original)
- **3D Product Models:** Interactive 3D product viewers
- **Blender Integration:** Automated 3D model generation
- **Custom Rendering:** High-quality product visualization
- **Model Export:** Multiple format support
- **Debug Tools:** Development and testing utilities

## 🏗️ Architecture

```
merged_project/
├── merged_backend/          # Django REST API
│   ├── backend/            # Django project
│   ├── requirements.txt    # Python dependencies
│   └── README.md          # Backend documentation
├── merged_frontend/        # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── package.json       # Node.js dependencies
│   └── README.md          # Frontend documentation
└── README.md              # This file
```

## 🛠️ Technology Stack

### Backend
- **Framework:** Django 5.1.6
- **API:** Django REST Framework
- **Database:** PostgreSQL
- **Cache/Queue:** Redis + Celery
- **AI/ML:** Transformers, Torch, Scikit-learn
- **3D:** Blender integration
- **Authentication:** JWT

### Frontend
- **Framework:** Next.js 15.3.1
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **3D Graphics:** Three.js + React Three Fiber
- **State Management:** Redux Toolkit
- **UI Components:** Radix UI
- **Forms:** React Hook Form + Zod

## 📦 Installation

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL
- Redis
- Blender (for 3D generation)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd merged_project
   ```

2. **Backend Setup:**
   ```bash
   cd merged_backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   
   # Set up environment variables
   cp .env.example .env
   # Edit .env with your database and API keys
   
   cd backend
   python manage.py migrate
   python manage.py createsuperuser
   python manage.py runserver
   ```

3. **Frontend Setup:**
   ```bash
   cd merged_frontend
   npm install
   
   # Set up environment variables
   cp .env.example .env.local
   # Edit .env.local with your API URLs
   
   npm run dev
   ```

4. **Start Services:**
   ```bash
   # Terminal 1: Backend
   cd merged_backend/backend
   python manage.py runserver
   
   # Terminal 2: Celery Worker
   cd merged_backend/backend
   celery -A core worker --loglevel=info
   
   # Terminal 3: Frontend
   cd merged_frontend
   npm run dev
   ```

## 🌐 API Endpoints

### Core E-Commerce
- `GET /api/products/` - List products
- `POST /api/cart/` - Add to cart
- `GET /api/orders/` - User orders
- `POST /api/payments/` - Process payment

### AI Chatbot
- `POST /api/chatbot/chat/` - Send message
- `GET /api/chatbot/recommendations/` - Get recommendations
- `POST /api/chatbot/behavior/` - Track behavior

### 3D Generation
- `POST /api/ai-3d-generation/generate/` - Generate 3D model
- `GET /api/ai-3d-generation/models/` - List models
- `GET /api/ai-3d-generation/render/` - Render 3D scene

## 🔧 Development

### Backend Development
```bash
cd merged_backend/backend
python manage.py makemigrations
python manage.py migrate
python manage.py test
```

### Frontend Development
```bash
cd merged_frontend
npm run lint
npm test
npm run build
```

### Adding New Features

1. **Backend:**
   - Create new Django app: `python manage.py startapp new_app`
   - Add to `INSTALLED_APPS` in settings
   - Create models, views, serializers
   - Add URL patterns

2. **Frontend:**
   - Create new components in `components/`
   - Add pages in `app/`
   - Update Redux store if needed
   - Add TypeScript types

## 🧪 Testing

### Backend Tests
```bash
cd merged_backend/backend
python manage.py test chatbot
python manage.py test ai_3d_generation
python manage.py test products
```

### Frontend Tests
```bash
cd merged_frontend
npm test
npm run test:coverage
```

## 📊 Monitoring & Analytics

- **Backend:** Django admin interface
- **Frontend:** Browser developer tools
- **Database:** PostgreSQL monitoring
- **Queue:** Celery monitoring
- **3D Generation:** Blender logs

## 🚀 Deployment

### Backend Deployment
1. Set up production database
2. Configure environment variables
3. Run migrations
4. Start Celery workers
5. Use Gunicorn/uWSGI

### Frontend Deployment
1. Build production assets: `npm run build`
2. Deploy to Vercel/Netlify
3. Configure environment variables
4. Set up CDN for static assets

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is for educational purposes.

## 🆘 Support

For issues and questions:
1. Check the documentation in each directory
2. Review the troubleshooting sections
3. Check existing issues
4. Create a new issue with detailed information

## 🔄 Version History

- **v1.0.0:** Initial merge of chatbot and 3D features
- **v1.1.0:** Added comprehensive documentation
- **v1.2.0:** Performance optimizations and bug fixes 