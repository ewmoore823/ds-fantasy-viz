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
            _get_season_from_espn(league_id, year)
        )
    all_time = _get_all_time_stats(seasons, start_year, end_year)

    context = {
        'league': {
            'name': seasons[-1]['league_name'],
            'seasons': seasons,
            'allTime': all_time,
            'seasonYears': list(range(start_year, end_year + 1)),
        }
    }
    return render(request, 'leaguestats/stats.html', context=context)


def _get_all_time_stats(raw_seasons, start_year, end_year):
    team_rankings = _get_team_rankings_data(raw_seasons, start_year, end_year)
    weeks, best_weeks, worst_weeks = _get_weeks(raw_seasons)
    all_seasons, best_seasons, worst_seasons = _parse_seasons(raw_seasons)
    matchups = _get_matchups(raw_seasons)
    return {
        'best_weeks': best_weeks,
        'worst_weeks': worst_weeks,
        'best_seasons': best_seasons,
        'worst_seasons': worst_seasons,
        'team_rankings': team_rankings,
        'matchups': matchups
    }


def _get_team_rankings_data(seasons, start_year, end_year):
    franchise_data_by_owner = {}
    for season in seasons:
        for team in season['teams']:
            year = season['year']
            owner = team['owner']

            if owner not in franchise_data_by_owner:
                franchise_data_by_owner[owner] = {}
                franchise_data_by_owner[owner]['total'] = 0
                franchise_data_by_owner[owner]['num_seasons'] = 0

            franchise = franchise_data_by_owner[owner]

            season_ppg = round(team['points_for'] / season['reg_season_count'], 1)
            franchise[str(year)] = season_ppg
            franchise['total'] += season_ppg
            franchise['num_seasons'] += 1

    teams = []
    for owner in franchise_data_by_owner.keys():
        team = {}
        franchise = franchise_data_by_owner[owner]

        team['owner'] = owner
        team['avg_ppg'] = round(franchise['total'] / franchise['num_seasons'], 1)
        team['seasons'] = []
        for year in range(start_year, end_year + 1):
            if str(year) in franchise:
                team['seasons'].append(franchise[str(year)])
            else:
                team['seasons'].append("N/A")
        teams.append(team)

    return sorted(teams, key=lambda x: -x['avg_ppg'])

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


def _parse_seasons(seasons):
    parsed_seasons = []
    for season in seasons:
        reg_season_count = season['reg_season_count']
        for parsed_season in season['teams']:
            parsed_seasons.append({
                'owner': parsed_season['owner'],
                'team_name': parsed_season['team_name'],
                'team_id': parsed_season['team_id'],
                'ppg': round(parsed_season['points_for'] / reg_season_count, 1),
                'pag': round(parsed_season['points_against'] / reg_season_count, 1),
                'year': season['year'],
            })

    parsed_seasons = sorted(parsed_seasons, key=lambda x: x['ppg'])
    # len/2 so that we don't show the same data in two tables (best/worst).
    num_to_show = int(min(len(parsed_seasons)/2, 20))
    best_seasons = parsed_seasons[-num_to_show:]
    worst_seasons = parsed_seasons[:num_to_show]

    return parsed_seasons, best_seasons, worst_seasons


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
                        'week': week + 1,
                    }
                )
    all_weeks = sorted(all_weeks, key=lambda x: x['score'])
    best_weeks = all_weeks[-20:]
    worst_weeks = all_weeks[:20]
    return all_weeks, best_weeks, worst_weeks


def _parse_season_matchups(schedule, scores, reg_season_count):
    games = []
    for i, (team, score) in enumerate(zip(schedule, scores)):
        if i > reg_season_count:
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


def parse_team(team, reg_season_count):
    team_dict = {}
    for attr in TEAM_ATTRS:
        team_dict[attr] = getattr(team, attr)
    team_dict['matchups'] = _parse_season_matchups(
        team.schedule,
        team.scores,
        reg_season_count
    )
    return team_dict


def _get_season_from_espn(league_id, year):
    raw_season = League(league_id, year)
    reg_season_count = raw_season.settings.reg_season_count
    return {
        "season_length": reg_season_count,
        "league_name": raw_season.settings.name,
        "league_id": raw_season.league_id,
        "year": raw_season.year,
        "teams": [parse_team(t, reg_season_count) for t in raw_season.teams],
        "reg_season_count": reg_season_count,
    }
