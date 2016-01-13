/// <reference path="../typings/moment/moment.d.ts"/>
/// <reference path="../typings/linq/linq.d.ts"/>
/// <reference path="../typings/sugar/sugar.d.ts"/>
/// <reference path="../../../PinewoodDerby.Dto/DoubleEliminationDtos.cs.d.ts"/>
/// <reference path="../typings/knockout/knockout.d.ts"/>
define(["require", "exports"], function(require, exports) {
    var ViewModel = (function () {
        function ViewModel(baseUrl) {
            var _this = this;
            this.Tournament = ko.observable();
            this.baseUrl = baseUrl;
            $(document).ready(function () {
                ko.applyBindings(_this, document.getElementById('mainContent'));
                _this.baseUrl = baseUrl;
                _this.LoadTournament();
            });
        }
        ViewModel.prototype.LoadTournament = function () {
            var _this = this;
            $.getJSON(this.baseUrl + "api/tournamentmanager/gettournament", function (response) {
                _this.Tournament(response.Content);
            });
        };

        ViewModel.prototype.GamesByRound = function () {
            return Enumerable.From(this.Tournament().Games).GroupBy(function (g) {
                return g.Round;
            }, null, function (key, g) {
                return { Key: key, List: g };
            }).ToArray();
        };
        ViewModel.prototype.Rounds = function () {
            var array = Enumerable.From(this.Tournament().Games).Select(function (g) {
                return g.Round;
            }).Distinct().OrderBy(function (i) {
                return i;
            }).ToArray();
            return array;
        };
        ViewModel.prototype.GamesForRound = function (round) {
            var games = Enumerable.From(this.Tournament().Games).Where(function (g) {
                return g.Round == round;
            }).ToArray();
            return games;
        };

        ViewModel.prototype.Height = function (game) {
            var rounds = this.Rounds();
            var height = (240 / (rounds.length - game.Round + 1));
            console.log(height);
            return height;
        };

        ViewModel.prototype.Top = function (game, position) {
            return this.Height(game);
        };
        return ViewModel;
    })();
    exports.ViewModel = ViewModel;
});
