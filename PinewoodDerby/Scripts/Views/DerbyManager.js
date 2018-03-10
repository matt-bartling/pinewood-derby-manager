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
            this.CurrentPhase = ko.observable("prelim");
            this.CurrentRace = ko.observable();
            this.NextFourRaces = ko.observableArray();
            this.DisplayedRaceResult = ko.observableArray([]);
            this.DisplayedRaceNumber = 0;
            this.DisplayedGroup = ko.observable();
            this.GroupStandings = ko.observableArray([]);
            this.CurrentStandingsPageInfo = ko.observable(null);
            this.StandingsPaused = ko.observable(false);
            this.Lane1Place = ko.observable(0);
            this.Lane2Place = ko.observable(0);
            this.Lane3Place = ko.observable(0);
            this.Lane4Place = ko.observable(0);
            this.CurrentStandingsPage = 0;
            this.StandingsPageSize = 10;
            this.LaneStats = ko.observableArray([]);
            this.baseUrl = baseUrl;
            this.Tournament(this.createDummyRace());

            $(document).ready(function () {
                ko.applyBindings(_this, document.getElementById('mainContent'));
                _this.baseUrl = baseUrl;
                _this.LoadTournament('2018');
            });
            $(document).keypress(function (event) {
                var car = null;

                if (event.charCode == 97) {
                    car = _this.CurrentRace().Car1;
                } else if (event.charCode == 115) {
                    car = _this.CurrentRace().Car2;
                } else if (event.charCode == 100) {
                    car = _this.CurrentRace().Car3;
                } else if (event.charCode == 102) {
                    car = _this.CurrentRace().Car4;
                }

                if (car != null) {
                    _this.CurrentRace_CarClick(car);
                }

                var place = event.charCode - 48;

                if (place >= 1 && place <= 4) {
                    if (_this.SelectedLane != null) {
                        _this.SelectedLane(place);
                    }
                }
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
                _this.LoadReturnedTournament(response.Content);
                _this.SetPageNumber(0);
            });
        };

        ViewModel.prototype.LoadReturnedTournament = function (tournament) {
            this.Tournament(tournament);
            var pageNumber = 0;
            this.StandingsPages = [];
            for (var n = 0; n < this.Tournament().Groups.length; n++) {
                var group = this.Tournament().Groups[n];
                var startPlace = 0;
                while (startPlace < group.Cars.length) {
                    var standingsPage = new StandingsPage();
                    standingsPage.GroupNumber = n;
                    standingsPage.GroupName = group.Name;
                    standingsPage.PageNumber = pageNumber;
                    standingsPage.PlaceIndex = startPlace;
                    this.StandingsPages.push(standingsPage);
                    startPlace += this.StandingsPageSize;
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
                            this.StandingsPages.push(standingsPage);
                            startPlace += this.StandingsPageSize;
                            pageNumber++;
                        }
                    }
                }
            }
            var lanePage = new StandingsPage();
            lanePage.PageNumber = pageNumber++;
            lanePage.ShowLaneStats = true;
            this.StandingsPages.push(lanePage);
            this.SetNextRace();
            this.SetNextResult();
            this.LaneStats(tournament.LaneStats);
            this.UpdateGroupStandings();
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
            var pageInfo = this.StandingsPages[this.CurrentStandingsPage];
            var group = this.Tournament().Groups[pageInfo.GroupNumber];
            if (group == null || group.Cars == null) {
                return [];
            }
            var groupName = pageInfo.GroupName + (pageInfo.GroupClassName == null ? "" : " - " + pageInfo.GroupClassName);

            var standings = Enumerable.From(this.Tournament().Standings).First(function (s) {
                return s.Group == groupName;
            });
            var pageStandings = Enumerable.From(standings.StandingsRows).Skip(pageInfo.PlaceIndex).Take(10).ToArray();
            this.GroupStandings(pageStandings);
            this.DisplayedGroup(group);
        };

        ViewModel.prototype.ContainsCar = function (race, car) {
            return race.Car1.Car.ID == car.ID || race.Car2.Car.ID == car.ID || race.Car3.Car.ID == car.ID || race.Car4.Car.ID == car.ID;
        };

        ViewModel.prototype.CurrentRace_CarClick = function (result) {
            var lanePlace = this.LanePlace(result);

            if (lanePlace != null) {
                this.SelectedLane = lanePlace;
            }

            if (this.SelectedLane() > 0) {
                return;
            }

            var nextPlaceToAssign = this.NextPlaceToAssign();
            this.SelectedLane(nextPlaceToAssign);
        };

        ViewModel.prototype.NextPlaceToAssign = function () {
            if (this.LanePlaces().none(1)) {
                return 1;
            } else if (this.LanePlaces().none(2)) {
                return 2;
            } else if (this.LanePlaces().none(3)) {
                return 3;
            } else {
                return 4;
            }
        };

        ViewModel.prototype.LanePlace = function (raceResult) {
            if (this.CurrentRace().Car1.Car.ID == raceResult.Car.ID) {
                return this.Lane1Place;
            }
            if (this.CurrentRace().Car2.Car.ID == raceResult.Car.ID) {
                return this.Lane2Place;
            }
            if (this.CurrentRace().Car3.Car.ID == raceResult.Car.ID) {
                return this.Lane3Place;
            }
            if (this.CurrentRace().Car4.Car.ID == raceResult.Car.ID) {
                return this.Lane4Place;
            }
            return null;
        };

        ViewModel.prototype.CurrentRace_AllPlacesSelected = function () {
            return this.Lane1Place() > 0 && this.Lane2Place() > 0 && this.Lane3Place() > 0 && this.Lane4Place() > 0;
        };

        ViewModel.prototype.LanePlaces = function () {
            return [this.Lane1Place(), this.Lane2Place(), this.Lane3Place(), this.Lane4Place()];
        };

        ViewModel.prototype.RaceResults = function (race) {
            return [race.Car1, race.Car2, race.Car3, race.Car4];
        };

        ViewModel.prototype.CurrentRace_ClearPlaces = function (race) {
            this.Lane1Place(0);
            this.Lane2Place(0);
            this.Lane3Place(0);
            this.Lane4Place(0);
        };

        ViewModel.prototype.CurrentRace_Save = function () {
            var _this = this;
            this.CurrentRace().Car1.Place = this.Lane1Place();
            this.CurrentRace().Car2.Place = this.Lane2Place();
            this.CurrentRace().Car3.Place = this.Lane3Place();
            this.CurrentRace().Car4.Place = this.Lane4Place();

            $('#current-race-container').css({ opacity: 0.5 });

            console.log("saving");
            $.post(this.baseUrl + "api/derbymanager/savetournament", this.Tournament()).done(function (response) {
                _this.LoadReturnedTournament(response.Content);
                console.log("saved 2");
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
            this.SetCurrentRaceTo(race);
        };

        ViewModel.prototype.SetCurrentRaceTo = function (race) {
            if (race != null) {
                this.Lane1Place(race.Car1.Place);
                this.Lane2Place(race.Car2.Place);
                this.Lane3Place(race.Car3.Place);
                this.Lane4Place(race.Car4.Place);
            }
            this.CurrentRace(race);
        };

        ViewModel.prototype.SetNextRace = function () {
            var _this = this;
            $('#current-race-container').fadeOut('fast', 'swing', function () {
                var nextRace = _this.NextRaceFrom(_this.Tournament().Races);
                _this.SetCurrentRaceTo(nextRace);
                $('#current-race-container').fadeIn('fast', 'swing');
                $('#current-race-container').css({ opacity: 1.0 });
            });
            $('#upcoming-races-container').fadeOut('fast', 'linear', function () {
                var nextFourRaces = _this.NextFourRacesFrom(_this.Tournament().Races);
                console.log(nextFourRaces);
                _this.NextFourRaces(nextFourRaces);
                $('#upcoming-races-container').fadeIn('fast', 'linear');
            });
        };

        ViewModel.prototype.NextFourRacesFrom = function (races) {
            var _this = this;
            return Enumerable.From(races).Where(function (r) {
                return !_this.IsRaceCompleted(r);
            }).OrderBy(function (r) {
                return r.RaceNumber;
            }).Skip(1).Take(2).ToArray();
        };

        ViewModel.prototype.NextRaceFrom = function (races) {
            var _this = this;
            return Enumerable.From(races).Where(function (r) {
                return !_this.IsRaceCompleted(r);
            }).OrderBy(function (r) {
                return r.RaceNumber;
            }).FirstOrDefault(null);
        };

        ViewModel.prototype.IsRaceCompleted = function (race) {
            return race.Car1.Place > 0 && race.Car2.Place > 0 && race.Car3.Place > 0 && race.Car4.Place > 0;
        };

        ViewModel.prototype.createDummyRace = function () {
            var obj = new Object();
            obj.Name = "dummy";
            obj.Groups = [];
            obj.Races = [];
            return obj;
        };

        ViewModel.prototype.DisplayName = function (car) {
            if (car.Name.startsWith("BYE")) {
                return "";
            }
            return car.Name;
        };

        ViewModel.prototype.DisplayIdAndCar = function (car) {
            if (car.ID.startsWith("BYE")) {
                return "";
            }
            return car.ID + " - " + car.Builder;
        };

        ViewModel.prototype.DisplayIdAndCarAndName = function (car) {
            if (car.ID.startsWith("BYE")) {
                return "";
            }
            return car.ID + " - " + car.Builder + " - " + car.Name;
        };
        return ViewModel;
    })();
    exports.ViewModel = ViewModel;

    var StandingsPage = (function () {
        function StandingsPage() {
        }
        StandingsPage.prototype.Title = function () {
            return this.GroupClassName == null ? this.GroupName : this.GroupName + ' - ' + this.GroupClassName;
        };
        return StandingsPage;
    })();
});
