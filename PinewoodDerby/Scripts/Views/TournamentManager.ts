/// <reference path="../typings/moment/moment.d.ts"/>
/// <reference path="../typings/linq/linq.d.ts"/>
/// <reference path="../typings/sugar/sugar.d.ts"/>
/// <reference path="../../../PinewoodDerby.Dto/DoubleEliminationDtos.cs.d.ts"/>
/// <reference path="../typings/knockout/knockout.d.ts"/>

import Common = require("Common");

export class ViewModel {
    private baseUrl: string;
    private Tournament = ko.observable<de.DoubleElminiationTournament>();

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        $(document).ready(() => {
            ko.applyBindings(this, document.getElementById('mainContent'));
            this.baseUrl = baseUrl;
            this.LoadTournament();
        });
    }

    public LoadTournament() {
        $.getJSON(this.baseUrl + "api/tournamentmanager/gettournament", (response: Common.ApiResponse<de.DoubleElminiationTournament>) => {
            this.Tournament(response.Content);
        });
    }

    public GamesByRound() {
        return Enumerable.From(this.Tournament().Games)
            .GroupBy(
                (g: de.Game) => { return g.Round; },
                null,
                (key, g) => { return { Key: key, List: g }; })
            .ToArray();
    }
    public Rounds() {
        var array = Enumerable.From(this.Tournament().Games)
            .Select((g: de.Game) => { return g.Round; })
            .Distinct()
            .OrderBy((i) => i)
            .ToArray();
        return array;
    }
    public GamesForRound(round: number) {
        var games = Enumerable.From(this.Tournament().Games)
            .Where((g: de.Game) => { return g.Round == round; })
            .ToArray();
        return games;
    }

    public Height(game: de.Game) {
        var rounds = this.Rounds();
        var height = (240 / (rounds.length - game.Round + 1));
        console.log(height);
        return height;
    }

    public Top(game: de.Game, position: number) {
        return this.Height(game);
    }
}

