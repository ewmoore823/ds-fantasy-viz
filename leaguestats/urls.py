
from django.urls import path

from . import views

urlpatterns = [
    path('', views.league_stats, name='league_stats'),
]
