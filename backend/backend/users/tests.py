from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()

class UserTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.admin_user = User.objects.create_superuser('admin', 'admin@test.com', 'password123')
        self.client.force_authenticate(user=self.admin_user)

    def test_create_user(self):
        url = '/api/users/'
        data = {
            'username': 'testuser',
            'email': 'testuser@test.com',
            'password': 'testpass123',
            'role': 'customer'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 2)
        self.assertEqual(User.objects.get(username='testuser').role, 'customer')

