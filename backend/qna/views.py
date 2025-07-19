from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter

from .models import Question, Answer
from .serializers import (
    QuestionSerializer, 
    QuestionCreateSerializer, 
    AnswerSerializer, 
    AnswerCreateSerializer
)
from products.models import Product


class IsSellerOrAdmin(permissions.BasePermission):
    """
    Custom permission to only allow sellers or admins to approve questions/answers.
    """
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        return request.user.role == 'seller'


class IsProductSeller(permissions.BasePermission):
    """
    Custom permission to only allow the seller of a product to approve questions.
    """
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff or request.user.role == 'admin':
            return True
        
        # For questions, check if user is the seller of the product
        if hasattr(obj, 'product'):
            return obj.product.seller == request.user
        
        # For answers, check if user is the seller of the product related to the question
        if hasattr(obj, 'question') and hasattr(obj.question, 'product'):
            return obj.question.product.seller == request.user
        
        return False


class QuestionViewSet(viewsets.ModelViewSet):
    """
    API endpoint for product questions
    """
    queryset = Question.objects.all()
    serializer_class = QuestionSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['content', 'product__name']
    ordering_fields = ['created_at', 'updated_at']
    
    def get_serializer_class(self):
        if self.action == 'create':
            return QuestionCreateSerializer
        return QuestionSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsProductSeller()]
        elif self.action in ['approve']:
            return [permissions.IsAuthenticated(), IsProductSeller()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Question.objects.all()
        
        # Filter by product if provided
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        
        # Filter by approval status
        is_approved = self.request.query_params.get('is_approved')
        if is_approved is not None:
            is_approved = is_approved.lower() == 'true'
            queryset = queryset.filter(is_approved=is_approved)
        
        # For regular users, only show approved questions unless they're the author
        user = self.request.user
        if not (user.is_staff or user.role == 'admin'):
            if user.role == 'seller':
                # Sellers can see all questions for their products plus approved questions for other products
                seller_products = Product.objects.filter(seller=user)
                queryset = queryset.filter(
                    Q(product__in=seller_products) | 
                    Q(is_approved=True) |
                    Q(user=user)
                ).distinct()
            else:
                # Regular users can see approved questions or their own questions
                queryset = queryset.filter(
                    Q(is_approved=True) | 
                    Q(user=user)
                ).distinct()
        
        return queryset
    
    @extend_schema(
        description="Approve a question",
        responses={200: QuestionSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsProductSeller])
    def approve(self, request, pk=None):
        """
        Approve a question
        """
        question = self.get_object()
        question.is_approved = True
        question.save()
        
        serializer = self.get_serializer(question)
        return Response(serializer.data)
    
    @extend_schema(
        description="Get questions for a specific product",
        parameters=[
            OpenApiParameter(
                name='product',
                description='Filter by product ID',
                required=True,
                type=int,
            ),
            OpenApiParameter(
                name='is_approved',
                description='Filter by approval status',
                required=False,
                type=bool,
            ),
        ],
    )
    @action(detail=False, methods=['get'])
    def by_product(self, request):
        """
        Get questions for a specific product
        """
        product_id = request.query_params.get('product')
        if not product_id:
            return Response(
                {'error': 'Product ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(product_id=product_id)
        
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        description="Get questions that need approval",
    )
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsSellerOrAdmin])
    def pending_approval(self, request):
        """
        Get questions that need approval
        """
        user = request.user
        
        if user.is_staff or user.role == 'admin':
            # Admins can see all pending questions
            queryset = Question.objects.filter(is_approved=False)
        elif user.role == 'seller':
            # Sellers can only see pending questions for their products
            seller_products = Product.objects.filter(seller=user)
            queryset = Question.objects.filter(
                product__in=seller_products,
                is_approved=False
            )
        else:
            return Response(
                {'error': 'You do not have permission to view pending questions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        description="Get my questions",
    )
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_questions(self, request):
        """
        Get questions asked by the current user
        """
        queryset = Question.objects.filter(user=request.user)
        
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AnswerViewSet(viewsets.ModelViewSet):
    """
    API endpoint for answers to product questions
    """
    queryset = Answer.objects.all()
    serializer_class = AnswerSerializer
    
    def get_serializer_class(self):
        if self.action == 'create':
            return AnswerCreateSerializer
        return AnswerSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), IsProductSeller()]
        elif self.action in ['approve']:
            return [permissions.IsAuthenticated(), IsProductSeller()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        queryset = Answer.objects.all()
        
        # Filter by question if provided
        question_id = self.request.query_params.get('question')
        if question_id:
            queryset = queryset.filter(question_id=question_id)
        
        # Filter by approval status
        is_approved = self.request.query_params.get('is_approved')
        if is_approved is not None:
            is_approved = is_approved.lower() == 'true'
            queryset = queryset.filter(is_approved=is_approved)
        
        # For regular users, only show approved answers unless they're the author
        user = self.request.user
        if not (user.is_staff or user.role == 'admin'):
            if user.role == 'seller':
                # Sellers can see all answers for their products plus approved answers for other products
                seller_products = Product.objects.filter(seller=user)
                seller_questions = Question.objects.filter(product__in=seller_products)
                queryset = queryset.filter(
                    Q(question__in=seller_questions) | 
                    Q(is_approved=True) |
                    Q(user=user)
                ).distinct()
            else:
                # Regular users can see approved answers or their own answers
                queryset = queryset.filter(
                    Q(is_approved=True) | 
                    Q(user=user)
                ).distinct()
        
        return queryset
    
    @extend_schema(
        description="Approve an answer",
        responses={200: AnswerSerializer}
    )
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsProductSeller])
    def approve(self, request, pk=None):
        """
        Approve an answer
        """
        answer = self.get_object()
        answer.is_approved = True
        answer.save()
        
        serializer = self.get_serializer(answer)
        return Response(serializer.data)
    
    @extend_schema(
        description="Get answers for a specific question",
        parameters=[
            OpenApiParameter(
                name='question',
                description='Filter by question ID',
                required=True,
                type=int,
            ),
            OpenApiParameter(
                name='is_approved',
                description='Filter by approval status',
                required=False,
                type=bool,
            ),
        ],
    )
    @action(detail=False, methods=['get'])
    def by_question(self, request):
        """
        Get answers for a specific question
        """
        question_id = request.query_params.get('question')
        if not question_id:
            return Response(
                {'error': 'Question ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        queryset = self.get_queryset().filter(question_id=question_id)
        
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        description="Get answers that need approval",
    )
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsSellerOrAdmin])
    def pending_approval(self, request):
        """
        Get answers that need approval
        """
        user = request.user
        
        if user.is_staff or user.role == 'admin':
            # Admins can see all pending answers
            queryset = Answer.objects.filter(is_approved=False)
        elif user.role == 'seller':
            # Sellers can only see pending answers for their products
            seller_products = Product.objects.filter(seller=user)
            seller_questions = Question.objects.filter(product__in=seller_products)
            queryset = Answer.objects.filter(
                question__in=seller_questions,
                is_approved=False
            )
        else:
            return Response(
                {'error': 'You do not have permission to view pending answers'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        description="Get my answers",
    )
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def my_answers(self, request):
        """
        Get answers provided by the current user
        """
        queryset = Answer.objects.filter(user=request.user)
        
        # Paginate the results
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)