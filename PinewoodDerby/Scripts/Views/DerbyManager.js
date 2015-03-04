/// <reference path="../typings/moment/moment.d.ts"/>
/// <reference path="../typings/linq/linq.d.ts"/>
/// <reference path="../typings/sugar/sugar.d.ts"/>
/// <reference path="../../../PinewoodDerby.Dto/PinewoodDerby.cs.d.ts"/>
/// <reference path="../typings/knockout/knockout.d.ts"/>
define(["require", "exports"], function(require, exports) {
    var ViewModel = (function () {
        function ViewModel(baseUrl) {
            var _this = this;
            this.AvailableTournaments = ko.observableArray([]);
            this.Tournament = ko.observable();
            this.Title = ko.observable("title");
            this.CurrentRace = ko.observable();
            this.NextFourRaces = ko.observableArray();
            this.DisplayedRaceResult = ko.observableArray([]);
            this.DisplayedRaceNumber = 0;
            this.DisplayedGroup = ko.observable();
            this.GroupStandings = ko.observableArray([]);
            this.CurrentStandingsPageInfo = ko.observable(null);
            this.StandingsPaused = ko.observable(false);
            this.First = ko.observable();
            this.Second = ko.observable();
            this.Third = ko.observable();
            this.Fourth = ko.observable();
            this.CurrentStandingsPage = 0;
            this.StandingsPageSize = 10;
            this.baseUrl = baseUrl;
            this.Tournament(this.createDummyRace());
            $(document).ready(function () {
                ko.applyBindings(_this, document.getElementById('mainContent'));
                _this.baseUrl = baseUrl;
                _this.LoadTournament('Pack 125 - 2015');
            });
            setInterval(function () {
                _this.SetNextResult();
            }, 5000);
            setInterval(function () {
                _this.SetNextStandingsPage(false);
            }, 15000);
            this.LoadAvailableTournaments();
            setInterval(function () {
                return _this.LoadAvailableTournaments();
            }, 5000);
        }
        ViewModel.prototype.LoadTournament = function (name) {
            var _this = this;
            $.getJSON(this.baseUrl + "api/derbymanager/gettournament?name=" + name, function (response) {
                _this.Tournament(response.Content);
                var pageNumber = 0;
                _this.StandingsPages = [];
                for (var n = 0; n < _this.Tournament().Groups.length; n++) {
                    var group = _this.Tournament().Groups[n];
                    var startPlace = 0;
                    while (startPlace < group.Cars.length) {
                        var standingsPage = new StandingsPage();
                        standingsPage.GroupNumber = n;
                        standingsPage.GroupName = group.Name;
                        standingsPage.PageNumber = pageNumber;
                        standingsPage.PlaceIndex = startPlace;
                        _this.StandingsPages.push(standingsPage);
                        startPlace += _this.StandingsPageSize;
                        pageNumber++;
                    }
                    if (group.ShowClassStandings) {
                        var classes = Enumerable.From(group.Cars).Select(function (x) {
                            return x.Class;
                        }).Distinct().ToArray();

                        for (var i = 0; i < classes.length; i++) {
                            var carsInClass = Enumerable.From(group.Cars).Where(function (x) {
                                return x.Class == classes[i];
                            }).ToArray();
                            startPlace = 0;
                            while (startPlace < carsInClass.length) {
                                standingsPage = new StandingsPage();
                                standingsPage.GroupNumber = n;
                                standingsPage.GroupName = group.Name;
                                standingsPage.PageNumber = pageNumber;
                                standingsPage.PlaceIndex = startPlace;
                                standingsPage.GroupClassName = classes[i];
                                _this.StandingsPages.push(standingsPage);
                                startPlace += _this.StandingsPageSize;
                                pageNumber++;
                            }
                        }
                    }
                }
                var lanePage = new StandingsPage();
                lanePage.PageNumber = pageNumber++;
                lanePage.ShowLaneStats = true;
                _this.StandingsPages.push(lanePage);
                _this.SetNextRace();
                _this.SetPageNumber(0);
                _this.SetNextResult();
            });
        };

        ViewModel.prototype.LoadAvailableTournaments = function () {
            var _this = this;
            $.getJSON(this.baseUrl + "api/derbymanager/getavailabletournaments", function (response) {
                _this.AvailableTournaments(response.Content.Names);
            });
        };

        ViewModel.prototype.Tournament_Pick = function (name) {
            this.LoadTournament(name);
        };

        ViewModel.prototype.SetNextResult = function () {
            var _this = this;
            $('#race-result').fadeOut(1000, 'linear', function () {
                if (_this.Tournament() != null && _this.Tournament().Races != null && _this.Tournament().Races.length > 0) {
                    _this.DisplayedRaceNumber = (_this.DisplayedRaceNumber % _this.Tournament().Races.length) + 1;
                    _this.DisplayedRaceResult(Enumerable.From(_this.Tournament().Races).Where(function (x) {
                        return x.RaceNumber == _this.DisplayedRaceNumber;
                    }).ToArray());
                }
                $('#race-result').fadeIn(1000, 'linear');
            });
        };

        ViewModel.prototype.SetNextStandingsPage = function (buttonPressed) {
            if (!this.StandingsPaused() || buttonPressed) {
                var pageNumber = ((this.CurrentStandingsPage + 1) % this.StandingsPages.length);
                this.SetPageNumber(pageNumber);
            }
        };

        ViewModel.prototype.Standings_NextPage = function () {
            this.SetNextStandingsPage(true);
        };

        ViewModel.prototype.Standings_PrevPage = function () {
            var pageNumber = this.CurrentStandingsPage == 0 ? this.StandingsPages.length - 1 : this.CurrentStandingsPage - 1;
            this.SetPageNumber(pageNumber);
        };

        ViewModel.prototype.Standings_Pause = function () {
            this.StandingsPaused(true);
        };

        ViewModel.prototype.Standings_Play = function () {
            this.StandingsPaused(false);
            this.SetNextStandingsPage(true);
        };

        ViewModel.prototype.SetPageNumber = function (pageNumber) {
            var _this = this;
            $('#standings-container').fadeOut('fast', 'swing', function () {
                _this.CurrentStandingsPage = pageNumber;
                _this.CurrentStandingsPageInfo(_this.StandingsPages[pageNumber]);
                if (_this.Tournament() != null && _this.Tournament().Groups != null && _this.Tournament().Groups.length > 0) {
                    _this.UpdateGroupStandings();
                }
                $('#standings-container').fadeIn('fast', 'swing');
            });
        };

        ViewModel.prototype.UpdateGroupStandings = function () {
            var _this = this;
            var pageInfo = this.StandingsPages[this.CurrentStandingsPage];
            var group = this.Tournament().Groups[pageInfo.GroupNumber];
            if (group == null || group.Cars == null) {
                return [];
            }
            var results = [];
            var races = this.Tournament().Races;
            group.Cars.forEach(function (c) {
                var racesWithCar = Enumerable.From(races).Where(function (r) {
                    return _this.ContainsCar(r, c);
                }).ToArray();
                var result = new GroupStandingsRow();
                result.Car = c;
                result.TotalRaces = racesWithCar.length;
                result.FirstPlaceFinishes = Enumerable.From(racesWithCar).Count(function (r) {
                    return r.First != null && r.First.ID == c.ID && r.First.Name == c.Name;
                });
                result.SecondPlaceFinishes = Enumerable.From(racesWithCar).Count(function (r) {
                    return r.Second != null && r.Second.ID == c.ID && r.Second.Name == c.Name;
                });
                result.ThirdPlaceFinishes = Enumerable.From(racesWithCar).Count(function (r) {
                    return r.Third != null && r.Third.ID == c.ID && r.Third.Name == c.Name;
                });
                result.FourthPlaceFinishes = Enumerable.From(racesWithCar).Count(function (r) {
                    return r.Fourth != null && r.Fourth.ID == c.ID && r.Fourth.Name == c.Name;
                });
                result.RacesRemaining = result.TotalRaces - result.FirstPlaceFinishes - result.SecondPlaceFinishes - result.ThirdPlaceFinishes - result.FourthPlaceFinishes;
                result.Points = 4 * result.FirstPlaceFinishes + 3 * result.SecondPlaceFinishes + 2 * result.ThirdPlaceFinishes + 1 * result.FourthPlaceFinishes;
                results.push(result);
            });
            var standings = Enumerable.From(results).Where(function (r) {
                return pageInfo.GroupClassName == null || r.Car.Class == pageInfo.GroupClassName;
            }).OrderByDescending(function (r) {
                return r.Points;
            }).ToArray();

            var lastPoints = -1;
            var lastPlaceAssigned = -1;
            for (var i = 0; i < standings.length; i++) {
                var row = standings[i];
                if (row.Points == lastPoints) {
                    row.Place = lastPlaceAssigned;
                } else {
                    row.Place = i + 1;
                    lastPoints = row.Points;
                    lastPlaceAssigned = row.Place;
                }
            }

            var standings = Enumerable.From(standings).OrderByDescending(function (r) {
                return r.Points;
            }).ThenByDescending(function (r) {
                return r.RacesRemaining;
            }).Skip(pageInfo.PlaceIndex).Take(this.StandingsPageSize).ToArray();
            this.GroupStandings(standings);
            this.DisplayedGroup(group);
        };

        ViewModel.prototype.LaneStats = function () {
            var _this = this;
            var lane1 = new LaneStatsRow();
            lane1.Lane = "Lane 1";
            var lane2 = new LaneStatsRow();
            lane2.Lane = "Lane 2";
            var lane3 = new LaneStatsRow();
            lane3.Lane = "Lane 3";
            var lane4 = new LaneStatsRow();
            lane4.Lane = "Lane 4";
            console.log(lane1);
            var races = Enumerable.From(this.Tournament().Races).Where(function (x) {
                return _this.IsRaceCompleted(x);
            }).ToArray();
            races.forEach(function (r) {
                _this.AddLaneResult(r.Car1, r, lane1);
                _this.AddLaneResult(r.Car2, r, lane2);
                _this.AddLaneResult(r.Car3, r, lane3);
                _this.AddLaneResult(r.Car4, r, lane4);
            });
            return Enumerable.From([lane1, lane2, lane3, lane4]).OrderByDescending(function (l) {
                return l.Points;
            }).ToArray();
        };

        ViewModel.prototype.AddLaneResult = function (laneCar, race, laneStats) {
            if (race.First.ID == laneCar.ID) {
                laneStats.Points += 4;
                laneStats.FirstPlaceFinishes++;
            }
            if (race.Second.ID == laneCar.ID) {
                laneStats.Points += 3;
                laneStats.SecondPlaceFinishes++;
            }
            if (race.Third.ID == laneCar.ID) {
                laneStats.Points += 2;
                laneStats.ThirdPlaceFinishes++;
            }
            if (race.Fourth.ID == laneCar.ID) {
                laneStats.Points += 1;
                laneStats.FourthPlaceFinishes++;
            }
        };

        ViewModel.prototype.ContainsCar = function (race, car) {
            return race.Car1.ID == car.ID || race.Car2.ID == car.ID || race.Car3.ID == car.ID || race.Car4.ID == car.ID;
        };

        ViewModel.prototype.CurrentRace_CarClick = function (car) {
            if (this.First() == car || this.Second() == car || this.Third() == car || this.Fourth() == car) {
                return;
            }

            if (this.First() == null) {
                this.First(car);
            } else if (this.Second() == null) {
                this.Second(car);
            } else if (this.Third() == null) {
                this.Third(car);
            } else if (this.Fourth() == null) {
                this.Fourth(car);
            }
        };

        ViewModel.prototype.CurrentRace_AllPlacesSelected = function () {
            return (this.First() != null && this.First().Name != null) && (this.Second() != null && this.Second().Name != null) && (this.Third() != null && this.Third().Name != null) && (this.Fourth() != null && this.Fourth().Name != null);
        };

        ViewModel.prototype.CurrentRace_ClearPlaces = function () {
            this.First(null);
            this.Second(null);
            this.Third(null);
            this.Fourth(null);
        };

        ViewModel.prototype.CurrentRace_Save = function () {
            var _this = this;
            this.CurrentRace().First = this.First();
            this.CurrentRace().Second = this.Second();
            this.CurrentRace().Third = this.Third();
            this.CurrentRace().Fourth = this.Fourth();

            $('#current-race-container').css({ opacity: 0.5 });

            $.post(this.baseUrl + "api/derbymanager/savetournament", this.Tournament()).done(function () {
                _this.SetNextRace();
                _this.UpdateGroupStandings();
            });
        };

        ViewModel.prototype.CurrentRace_NextRace = function () {
            this.SetCurrentRace((this.CurrentRace().RaceNumber % this.Tournament().Races.length) + 1);
        };

        ViewModel.prototype.CurrentRace_PrevRace = function () {
            var currentRaceNumber = this.CurrentRace().RaceNumber;
            var nextRaceNumber = currentRaceNumber == 1 ? this.Tournament().Races.length : currentRaceNumber - 1;
            this.SetCurrentRace(nextRaceNumber);
        };

        ViewModel.prototype.SetCurrentRace = function (raceNumber) {
            var race = Enumerable.From(this.Tournament().Races).First(function (r) {
                return r.RaceNumber == raceNumber;
            });
            if (race == null) {
                return;
            }
            if (race.First != null && race.First.Name != null) {
                this.First(race.First);
            } else {
                this.First(null);
            }
            if (race.Second != null && race.Second.Name != null) {
                this.Second(race.Second);
            } else {
                this.Second(null);
            }
            if (race.Third != null && race.Third.Name != null) {
                this.Third(race.Third);
            } else {
                this.Third(null);
            }
            if (race.Fourth != null && race.Fourth.Name != null) {
                this.Fourth(race.Fourth);
            } else {
                this.Fourth(null);
            }
            this.CurrentRace(race);
        };

        ViewModel.prototype.SetNextRace = function () {
            var _this = this;
            $('#current-race-container').fadeOut('fast', 'swing', function () {
                var nextRace = Enumerable.From(_this.Tournament().Races).Where(function (r) {
                    return !_this.IsRaceCompleted(r);
                }).OrderBy(function (r) {
                    return r.RaceNumber;
                }).FirstOrDefault(null);
                _this.CurrentRace(nextRace);
                _this.CurrentRace_ClearPlaces();
                $('#current-race-container').fadeIn('fast', 'swing');
                $('#current-race-container').css({ opacity: 1.0 });
            });
            $('#upcoming-races-container').fadeOut('fast', 'linear', function () {
                var nextFourRaces = Enumerable.From(_this.Tournament().Races).Where(function (r) {
                    return !_this.IsRaceCompleted(r);
                }).OrderBy(function (r) {
                    return r.RaceNumber;
                }).Skip(1).Take(4).ToArray();
                _this.NextFourRaces(nextFourRaces);
                $('#upcoming-races-container').fadeIn('fast', 'linear');
            });
        };

        ViewModel.prototype.IsRaceCompleted = function (race) {
            return race.First != null && race.First.Name != null && race.Second != null && race.Second.Name != null && race.Third != null && race.Third.Name != null && race.Fourth != null && race.Fourth.Name != null;
        };

        ViewModel.prototype.createDummyRace = function () {
            var obj = new Object();
            obj.Name = "dummy";
            obj.Groups = [];
            obj.Races = [];
            return obj;
        };
        return ViewModel;
    })();
    exports.ViewModel = ViewModel;

    var GroupStandingsRow = (function () {
        function GroupStandingsRow() {
        }
        return GroupStandingsRow;
    })();

    var LaneStatsRow = (function () {
        function LaneStatsRow() {
            this.FirstPlaceFinishes = 0;
            this.SecondPlaceFinishes = 0;
            this.ThirdPlaceFinishes = 0;
            this.FourthPlaceFinishes = 0;
            this.Points = 0;
        }
        return LaneStatsRow;
    })();

    var StandingsPage = (function () {
        function StandingsPage() {
        }
        StandingsPage.prototype.Title = function () {
            return this.GroupClassName == null ? this.GroupName : this.GroupName + ' - ' + this.GroupClassName;
        };
        return StandingsPage;
    })();
});
