from rest_framework import serializers
from .models import Question, Answer
from django.contrib.auth import get_user_model
from typing import Dict, Any, Optional, List, Union
from drf_spectacular.utils import extend_schema_field
from drf_spectacular.types import OpenApiTypes

User = get_user_model()

class UserBasicSerializer(serializers.ModelSerializer):
    """
    Basic user information for Q&A
    """
    class Meta:
        model = User
        fields = ['id', 'username']


class AnswerSerializer(serializers.ModelSerializer):
    """
    Serializer for answers
    """
    user_details = UserBasicSerializer(source='user', read_only=True)
    is_seller = serializers.SerializerMethodField()
    
    class Meta:
        model = Answer
        fields = ['id', 'question', 'user', 'user_details', 'content', 
                  'created_at', 'updated_at', 'is_approved', 'is_seller']
        read_only_fields = ['user', 'created_at', 'updated_at', 'is_approved']
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_seller(self, obj) -> bool:
        """
        Check if the user who answered is the seller of the product
        """
        try:
            product = obj.question.product
            return obj.user == product.seller
        except:
            return False


class QuestionSerializer(serializers.ModelSerializer):
    """
    Serializer for questions with answers
    """
    user_details = UserBasicSerializer(source='user', read_only=True)
    answers = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'product', 'product_name', 'user', 'user_details', 'content', 
                  'created_at', 'updated_at', 'is_approved', 'answers']
        read_only_fields = ['user', 'created_at', 'updated_at', 'is_approved']
    
    @extend_schema_field({'type': 'array', 'items': {'type': 'object'}})
    def get_answers(self, obj) -> List[Dict[str, Any]]:
        """
        Get approved answers for this question
        """
        # Only get approved answers
        answers = obj.answers.filter(is_approved=True)
        return AnswerSerializer(answers, many=True).data


class QuestionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating questions
    """
    class Meta:
        model = Question
        fields = ['product', 'content']
    
    def create(self, validated_data):
        user = self.context['request'].user
        return Question.objects.create(user=user, **validated_data)


class AnswerCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating answers
    """
    class Meta:
        model = Answer
        fields = ['question', 'content']
    
    def create(self, validated_data):
        user = self.context['request'].user
        question = validated_data.get('question')
        
        # Check if the user is the seller of the product or an admin
        if user.is_staff or user.role == 'admin' or question.product.seller == user:
            # Auto-approve answers from sellers and admins
            return Answer.objects.create(user=user, is_approved=True, **validated_data)
        else:
            return Answer.objects.create(user=user, **validated_data)


# Additional serializers for admin operations

class QuestionAdminSerializer(serializers.ModelSerializer):
    """
    Serializer for admin operations on questions
    """
    user_details = UserBasicSerializer(source='user', read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)
    answer_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Question
        fields = ['id', 'product', 'product_name', 'user', 'user_details', 'content', 
                  'created_at', 'updated_at', 'is_approved', 'answer_count']
    
    @extend_schema_field(OpenApiTypes.INT)
    def get_answer_count(self, obj) -> int:
        """
        Get the count of all answers
        """
        return obj.answers.count()


class AnswerAdminSerializer(serializers.ModelSerializer):
    """
    Serializer for admin operations on answers
    """
    user_details = UserBasicSerializer(source='user', read_only=True)
    question_content = serializers.SerializerMethodField()
    product_name = serializers.SerializerMethodField()
    is_seller = serializers.SerializerMethodField()
    
    class Meta:
        model = Answer
        fields = ['id', 'question', 'question_content', 'user', 'user_details', 
                  'content', 'created_at', 'updated_at', 'is_approved', 
                  'is_seller', 'product_name']
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_question_content(self, obj) -> str:
        """
        Get the content of the question
        """
        return obj.question.content if obj.question else None
    
    @extend_schema_field(OpenApiTypes.STR)
    def get_product_name(self, obj) -> Optional[str]:
        """
        Get the name of the product
        """
        try:
            return obj.question.product.name
        except:
            return None
    
    @extend_schema_field(OpenApiTypes.BOOL)
    def get_is_seller(self, obj) -> bool:
        """
        Check if the user who answered is the seller of the product
        """
        try:
            product = obj.question.product
            return obj.user == product.seller
        except:
            return False


class QuestionApprovalSerializer(serializers.ModelSerializer):
    """
    Serializer for approving or rejecting questions
    """
    class Meta:
        model = Question
        fields = ['is_approved']


class AnswerApprovalSerializer(serializers.ModelSerializer):
    """
    Serializer for approving or rejecting answers
    """
    class Meta:
        model = Answer
        fields = ['is_approved']


class QuestionFilterSerializer(serializers.Serializer):
    """
    Serializer for filtering questions
    """
    product_id = serializers.IntegerField(required=False)
    user_id = serializers.IntegerField(required=False)
    is_approved = serializers.BooleanField(required=False)
    search = serializers.CharField(required=False)
    order_by = serializers.ChoiceField(
        choices=['created_at', '-created_at'],
        required=False,
        default='-created_at'
    )


class AnswerFilterSerializer(serializers.Serializer):
    """
    Serializer for filtering answers
    """
    question_id = serializers.IntegerField(required=False)
    user_id = serializers.IntegerField(required=False)
    is_approved = serializers.BooleanField(required=False)
    is_seller = serializers.BooleanField(required=False)
    search = serializers.CharField(required=False)
    order_by = serializers.ChoiceField(
        choices=['created_at', '-created_at'],
        required=False,
        default='-created_at'
    )