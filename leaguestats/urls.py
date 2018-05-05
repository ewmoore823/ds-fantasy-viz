
from django.urls import path

from . import views

app_name="leaguestats"

urlpatterns = [
    path('', views.home, name='home'),
    path('get_league_page', views.get_league_page, name='get_league_page'),
    path('leauge/<int:league_id>/start/<int:start_year>/end/<int:end_year>', views.league_stats, name='league_stats'),
]
