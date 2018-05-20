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
}
