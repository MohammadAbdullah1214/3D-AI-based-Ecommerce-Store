from django.contrib import admin
from .models import Question, Answer

class AnswerInline(admin.TabularInline):
    model = Answer
    extra = 1
    readonly_fields = ['user', 'created_at', 'updated_at']

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['id', 'product', 'user', 'created_at', 'is_approved']
    list_filter = ['is_approved', 'created_at']
    search_fields = ['content', 'product__name', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [AnswerInline]
    actions = ['approve_questions']
    
    def approve_questions(self, request, queryset):
        queryset.update(is_approved=True)
    approve_questions.short_description = "Approve selected questions"

@admin.register(Answer)
class AnswerAdmin(admin.ModelAdmin):
    list_display = ['id', 'question', 'user', 'created_at', 'is_approved']
    list_filter = ['is_approved', 'created_at']
    search_fields = ['content', 'question__content', 'user__username']
    readonly_fields = ['created_at', 'updated_at']
    actions = ['approve_answers']
    
    def approve_answers(self, request, queryset):
        queryset.update(is_approved=True)
    approve_answers.short_description = "Approve selected answers"