$(document).ready(function() {
    $("#league-link").click(getLeague);
    $("#seasons-link").click(getSeasonStats);
    $("#teams-link").click(getTeams);
});

function getLeague() {
    switchSection('league');
}

function getSeasonStats() {
    switchSection('seasons');
}

function getTeams() {
    switchSection('teams');
}

function switchSection(enabledSection) {
    otherSections = new Set(['league', 'seasons', 'teams']);
    otherSections.delete(enabledSection);
    otherSections.forEach(function(section) {
        $('#' + section + '-link').removeClass('active');
        $('#' + section + '-section').addClass('hide');
    });
    $('#' + enabledSection + '-link').addClass('active');
    $('#' + enabledSection + '-section').removeClass('hide');
    hideGraphs(enabledSection);
}

function hideGraphs(section) {
    if (section === "league") {
        $('#all-scores').removeClass('hide');
    }
    else {
        $('#all-scores').addClass('hide');
    }
    if (section === "seasons") {
        for (var i=0; i< League.seasons.length; i++) {
            $('#graph-'+League.seasons[i].year).removeClass('hide');
        }
    }
    else {
        for (var i=0; i< League.seasons.length; i++) {
            $('#graph-'+League.seasons[i].year).addClass('hide');
        }
    }
}
