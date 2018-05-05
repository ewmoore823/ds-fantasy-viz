from django.shortcuts import render

from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse

def home(request):
    return render(request, 'leaguestats/stats.html', {})


def get_league_page(request):
    if request.method != "POST":
        return HttpResponse(status=400)
    league_id = request.POST['league_id']
    start_year = request.POST['start_year']
    end_year = request.POST['end_year']
    return HttpResponseRedirect(
        reverse(
            'leaguestats:league_stats',
            args=(league_id, start_year, end_year)
        )
    )

def league_stats(request, league_id, start_year, end_year):
    return HttpResponse(f"redirect succeeded {league_id} {start_year} {end_year}")
