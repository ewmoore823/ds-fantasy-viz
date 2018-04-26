import json
import pickle

import espnff

LEAGUE_ID = 374681
YEARS = [2011, 2012, 2013, 2014, 2015, 2016, 2017]


league_attrs = ['league_id', 'year', 'teams']
TEAM_ATTRS = ('team_id', 'team_abbrev', 'team_name', 'wins', 'losses', 'points_for', 'points_against', 'owner')


def parse_team(team):
    team_dict = {}
    for attr in TEAM_ATTRS:
        team_dict[attr] = getattr(team, attr)
        team_dict['matchups'] = get_matchups(team.schedule, team.scores)
    return team_dict


def get_matchups(schedule, scores):
    games = []
    for i, (team, score) in enumerate(zip(schedule, scores)):
        if i > 13:
            continue  # playoffs
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


def get_data_for_year(year):
    raw_league = espnff.League(LEAGUE_ID, year)
    league = {
        "league_id": raw_league.league_id,
        "year": raw_league.year,
    }

    teams = []
    for team in raw_league.teams:
        teams.append(
            parse_team(team)
        )
    league['teams'] = teams
    with open('league-{}.json'.format(year), 'w') as fp:
            json.dump(league, fp, indent=4, sort_keys=True)



if __name__ == "__main__":
    for year in YEARS:
        get_data_for_year(year)
