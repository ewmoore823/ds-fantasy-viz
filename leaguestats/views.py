from django.core import serializers
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.urls import reverse

from espnff import League


TEAM_ATTRS = ('team_id', 'team_abbrev', 'team_name', 'wins', 'losses', 'points_for', 'points_against', 'owner')


def home(request):
    return render(request, 'leaguestats/home.html', {})


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
    seasons = []
    for year in range(start_year, end_year + 1):
        seasons.append(
            _parse_season(league_id, year)
        )
    all_time = _get_all_time_stats(seasons)
    context = {
        'league': {
            'name': seasons[-1]['league_name'],
            'seasons': seasons,
            'allTime': all_time
        }
    }
    return render(request, 'leaguestats/stats.html', context=context)


def _get_all_time_stats(seasons):
    weeks, best_weeks, worst_weeks = _get_weeks(seasons)
    teams = _get_teams(seasons)
    matchups = _get_matchups(seasons)
    return {
        'weeks': weeks,
        'best_weeks': best_weeks,
        'worst_weeks': worst_weeks,
        'teams': teams,
        'matchups': matchups
    }

def _get_matchups(seasons):
    matchup_stats = {}
    for season in seasons:
        for team in season['teams']:
            owner = team['owner']
            if owner not in matchup_stats:
                matchup_stats[owner] = {}
            for matchup in team['matchups']:
                opponent_owner = matchup['opponent']['owner']
                if opponent_owner not in matchup_stats[owner]:
                    matchup_stats[owner][opponent_owner] = {
                        'points_for': 0,
                        'points_against': 0,
                        'wins': 0,
                        'losses': 0,
                        'ties': 0
                    }
                matchup_stats[owner][opponent_owner]['points_for'] += matchup['points_for']
                matchup_stats[owner][opponent_owner]['points_against'] += matchup['points_against']
                if matchup['points_for'] > matchup['points_against']:
                    matchup_stats[owner][opponent_owner]['wins'] += 1
                elif matchup['points_for'] < matchup['points_against']:
                    matchup_stats[owner][opponent_owner]['losses'] += 1
                else:
                    matchup_stats[owner][opponent_owner]['ties'] += 1
    return matchup_stats


def _get_teams(seasons):
    all_teams = []
    for season in seasons:
        for team in season['teams']:
            all_teams.append({
                'owner': team['owner'],
                'team_name': team['team_name'],
                'team_id': team['team_id'],
                'points_for': team['points_for'],
                'year': season['year'],
                'points_against': team['points_against']
            })
    return all_teams


def _get_weeks(seasons):
    all_weeks = []
    for season in seasons:
        for team in season['teams']:
            for week, matchup in enumerate(team['matchups']):
                all_weeks.append(
                    {
                        'owner': team['owner'],
                        'team_name': team['team_name'],
                        'team_id': team['team_id'],
                        'score': matchup['points_for'],
                        'year': season['year'],
                        'week': week,
                    }
                )
    all_weeks = sorted(all_weeks, key=lambda x: x['score'])
    best_weeks = all_weeks[-20:]
    worst_weeks = all_weeks[:20]
    return all_weeks, best_weeks, worst_weeks


def _parse_season_matchups(schedule, scores):
    games = []
    for i, (team, score) in enumerate(zip(schedule, scores)):
        if i > 13:
            continue  # playoffs... wont work for leagues w/ diff playoff settings
        game = {
           "week": i + 1,
           "opponent": {
               "team_id": team.team_id,
               "team_name": team.team_name,
               "owner": team.owner,
           },
           "points_for": score,
           "points_against": schedule[i].scores[i],
        }
        games.append(game)
    return games


def parse_team(team):
    team_dict = {}
    for attr in TEAM_ATTRS:
        team_dict[attr] = getattr(team, attr)
    team_dict['matchups'] = _parse_season_matchups(team.schedule, team.scores)
    return team_dict


def _parse_season(league_id, year):
    raw_season = League(league_id, year)
    return {
        "league_name": raw_season.settings.name,
        "league_id": raw_season.league_id,
        "year": raw_season.year,
        "teams": [parse_team(t) for t in raw_season.teams]
    }
