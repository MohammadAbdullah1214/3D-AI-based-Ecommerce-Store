from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category, Product

User = get_user_model()

class ProductTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user('testuser', 'test@test.com', 'password123')
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name='Test Category')

    def test_create_product(self):
        url = '/api/products/'
        data = {
            'name': 'Test Product',
            'description': 'This is a test product',
            'regular_price': '9.99',
            'stock': 10,
            'category': self.category.id
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.count(), 1)
        self.assertEqual(Product.objects.get().name, 'Test Product')

