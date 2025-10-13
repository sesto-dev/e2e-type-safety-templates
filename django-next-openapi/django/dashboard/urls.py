from django.urls import path, include
from rest_framework.routers import DefaultRouter

from dashboard.views.general import UserViewSet, TodoListCreateView, TodoRetrieveUpdateDestroyView

router = DefaultRouter()

router.register(r'users', UserViewSet)


urlpatterns = [
    path('', include(router.urls)),
    path("api/todos/", TodoListCreateView.as_view(), name="todo-list-create"),
    path("api/todos/<uuid:id>/", TodoRetrieveUpdateDestroyView.as_view(), name="todo-detail"),
]