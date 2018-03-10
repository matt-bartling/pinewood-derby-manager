/// <reference path="../typings/moment/moment.d.ts"/>
/// <reference path="../typings/linq/linq.d.ts"/>
/// <reference path="../typings/sugar/sugar.d.ts"/>
/// <reference path="../../../PinewoodDerby.Dto/PinewoodDerby.cs.d.ts"/>
/// <reference path="../typings/knockout/knockout.d.ts"/>

import Common = require("Common");

export class ViewModel {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
        this.Tournament(this.createDummyRace());

        $(document).ready(() => {
            ko.applyBindings(this, document.getElementById('mainContent'));
            this.baseUrl = baseUrl;
            this.LoadTournament('2018');
        });
        $(document).keypress((event) => {
            var car = null;

            if (event.charCode == 97) {
                car = this.CurrentRace().Car1;
            } else if (event.charCode == 115) {
                car = this.CurrentRace().Car2;
            } else if (event.charCode == 100) {
                car = this.CurrentRace().Car3;
            } else if (event.charCode == 102) {
                car = this.CurrentRace().Car4;
            }

            if (car != null) {
                this.CurrentRace_CarClick(car);
            }

            var place = event.charCode - 48;

            if (place >= 1 && place <= 4) {
                if (this.SelectedLane != null) {
                    this.SelectedLane(place);
                }
            }
        });
        setInterval(() => { this.SetNextResult(); }, 5000);
        setInterval(() => { this.SetNextStandingsPage(false); }, 15000);
        this.LoadAvailableTournaments();
        setInterval(() => this.LoadAvailableTournaments(), 5000);
    }

    public LoadTournament(name: string) {
        $.getJSON(this.baseUrl + "api/derbymanager/gettournament?name=" + name, (response: Common.ApiResponse<pinewoodderby.Tournament>) => {
            this.LoadReturnedTournament(response.Content);
            this.SetPageNumber(0);
        });
    }

    public LoadReturnedTournament(tournament: pinewoodderby.Tournament) {
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
                var classes = Enumerable.From(group.Cars)
                    .Select((x: pinewoodderby.Car) => x.Class)
                    .Distinct()
                    .ToArray();

                for (var i = 0; i < classes.length; i++) {
                    var carsInClass = Enumerable.From(group.Cars)
                        .Where((x: pinewoodderby.Car) => x.Class == classes[i])
                        .ToArray();
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
    }

    public LoadAvailableTournaments() {
        $.getJSON(this.baseUrl + "api/derbymanager/getavailabletournaments", (response: Common.ApiResponse<pinewoodderby.AvailableTournaments>) => {
            this.AvailableTournaments(response.Content.Names);
        });
    }

    private Tournament_Pick(name: string) {
        this.LoadTournament(name);
    }

    private AvailableTournaments = ko.observableArray<string>([]);

    private SetNextResult() {
        $('#race-result').fadeOut(1000, 'linear', () => {
            if (this.Tournament() != null && this.Tournament().Races != null && this.Tournament().Races.length > 0) {
                this.DisplayedRaceNumber = (this.DisplayedRaceNumber % this.Tournament().Races.length) + 1;
                this.DisplayedRaceResult(Enumerable.From(this.Tournament().Races)
                    .Where((x: pinewoodderby.Race) => x.RaceNumber == this.DisplayedRaceNumber)
                    .ToArray());
            }
            $('#race-result').fadeIn(1000, 'linear');
        });
    }

    private SetNextStandingsPage(buttonPressed: boolean) {
        if (!this.StandingsPaused() || buttonPressed) {
        var pageNumber = ((this.CurrentStandingsPage + 1) % this.StandingsPages.length);
        this.SetPageNumber(pageNumber);
        }
    }

    private Standings_NextPage() {
        this.SetNextStandingsPage(true);
    }

    private Standings_PrevPage() {
        var pageNumber = this.CurrentStandingsPage == 0 ? this.StandingsPages.length - 1 : this.CurrentStandingsPage - 1;
        this.SetPageNumber(pageNumber);
    }

    private Standings_Pause() {
        this.StandingsPaused(true);
    }

    private Standings_Play() {
        this.StandingsPaused(false);
        this.SetNextStandingsPage(true);
    }

    private SetPageNumber(pageNumber: number) {
        $('#standings-container').fadeOut('fast', 'swing', () => {
            this.CurrentStandingsPage = pageNumber;
            this.CurrentStandingsPageInfo(this.StandingsPages[pageNumber]);
            if (this.Tournament() != null && this.Tournament().Groups != null && this.Tournament().Groups.length > 0) {
                this.UpdateGroupStandings();
            }
            $('#standings-container').fadeIn('fast', 'swing');
        });
    }

    private UpdateGroupStandings() {
        var pageInfo = this.StandingsPages[this.CurrentStandingsPage];
        var group = this.Tournament().Groups[pageInfo.GroupNumber];
        if (group == null || group.Cars == null) {
            return [];
        }
        var groupName = pageInfo.GroupName + (pageInfo.GroupClassName == null ? "" : " - " + pageInfo.GroupClassName);

        var standings = Enumerable.From(this.Tournament().Standings)
            .First((s: pinewoodderby.GroupStandings) => s.Group == groupName);
        var pageStandings = Enumerable.From(standings.StandingsRows)
            .Skip(pageInfo.PlaceIndex).Take(10).ToArray();
        this.GroupStandings(pageStandings);
        this.DisplayedGroup(group);
    }

    private ContainsCar(race: pinewoodderby.Race, car: pinewoodderby.Car) {
        return race.Car1.Car.ID == car.ID ||
            race.Car2.Car.ID == car.ID ||
            race.Car3.Car.ID == car.ID ||
            race.Car4.Car.ID == car.ID;
    }

    private Tournament = ko.observable<pinewoodderby.Tournament>();
    private Title = ko.observable("title");
    private CurrentPhase = ko.observable<string>("prelim");
    private CurrentRace = ko.observable<pinewoodderby.Race>();
    private NextFourRaces = ko.observableArray<pinewoodderby.Race>();
    private DisplayedRaceResult = ko.observableArray<pinewoodderby.Race>([]);
    private DisplayedRaceNumber = 0;
    private DisplayedGroup = ko.observable<pinewoodderby.Group>();
    private GroupStandings = ko.observableArray<pinewoodderby.GroupStandingsRow>([]);
    private CurrentStandingsPageInfo = ko.observable<StandingsPage>(null);
    private StandingsPaused = ko.observable(false);

    private Lane1Place = ko.observable(0);
    private Lane2Place = ko.observable(0);
    private Lane3Place = ko.observable(0);
    private Lane4Place = ko.observable(0);
    private SelectedLane: KnockoutObservable<number>;

    private CurrentStandingsPage = 0;
    private StandingsPageSize = 10;
    private StandingsPages: StandingsPage[];
    private LaneStats = ko.observableArray<pinewoodderby.LaneStat>([]);

    private CurrentRace_CarClick(result: pinewoodderby.RaceResult) {
        var lanePlace = this.LanePlace(result);

        if (lanePlace != null) {
            this.SelectedLane = lanePlace;
        }

        if (this.SelectedLane() > 0) {
            return;
        }

        var lastPlaceAssigned = Enumerable.From(this.LanePlaces()).Count((lp: number) => lp > 0);
        var nextPlace = lastPlaceAssigned + 1;
        this.SelectedLane(nextPlace);
    }

    private LanePlace(raceResult: pinewoodderby.RaceResult) {
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
    }

    private CurrentRace_AllPlacesSelected() {
        return this.Lane1Place() > 0 &&
            this.Lane2Place() > 0 &&
            this.Lane3Place() > 0 &&
            this.Lane4Place() > 0;
    }

    private LanePlaces() {
        return [this.Lane1Place(), this.Lane2Place(), this.Lane3Place(), this.Lane4Place()];
    }

    private RaceResults(race: pinewoodderby.Race) {
        return [race.Car1, race.Car2, race.Car3, race.Car4];
    }

    private CurrentRace_ClearPlaces() {
        this.Lane1Place(0);
        this.Lane2Place(0);
        this.Lane3Place(0);
        this.Lane4Place(0);
    }

    private CurrentRace_Save() {
        this.CurrentRace().Car1.Place = this.Lane1Place();
        this.CurrentRace().Car2.Place = this.Lane2Place();
        this.CurrentRace().Car3.Place = this.Lane3Place();
        this.CurrentRace().Car4.Place = this.Lane4Place();

        $('#current-race-container').css({ opacity: 0.5 });

        console.log("saving");
        $.post(this.baseUrl + "api/derbymanager/savetournament", this.Tournament())
            .done((response: Common.ApiResponse<pinewoodderby.Tournament>) => {
                this.LoadReturnedTournament(response.Content);
                console.log("saved");
                this.SetNextRace();
                this.UpdateGroupStandings();
            });
    }

    private CurrentRace_NextRace() {
        this.SetCurrentRace((this.CurrentRace().RaceNumber % this.Tournament().Races.length) + 1);
    }

    private CurrentRace_PrevRace() {
        var currentRaceNumber = this.CurrentRace().RaceNumber;
        var nextRaceNumber = currentRaceNumber == 1 ? this.Tournament().Races.length : currentRaceNumber - 1;
        this.SetCurrentRace(nextRaceNumber);
    }

    private SetCurrentRace(raceNumber: number) {
        var race = Enumerable.From(this.Tournament().Races)
            .First((r: pinewoodderby.Race) => r.RaceNumber == raceNumber);
        if (race == null) {
            return;
        }
        this.Lane1Place(race.Car1.Place);
        this.Lane2Place(race.Car2.Place);
        this.Lane3Place(race.Car3.Place);
        this.Lane4Place(race.Car4.Place);
        this.CurrentRace(race);
    }

    private SetNextRace() {
        $('#current-race-container').fadeOut('fast', 'swing', () => {
            var nextRace = this.NextRaceFrom(this.Tournament().Races);
            this.CurrentRace(nextRace);
            this.CurrentRace_ClearPlaces();
            $('#current-race-container').fadeIn('fast', 'swing');
            $('#current-race-container').css({ opacity: 1.0 });
        });
        $('#upcoming-races-container').fadeOut('fast', 'linear', () => {
            var nextFourRaces = this.NextFourRacesFrom(this.Tournament().Races);
            console.log(nextFourRaces);
            this.NextFourRaces(nextFourRaces);
            $('#upcoming-races-container').fadeIn('fast', 'linear');
        });
    }

    private NextFourRacesFrom(races: pinewoodderby.Race[]) {
        return Enumerable.From(races)
            .Where((r: pinewoodderby.Race) => !this.IsRaceCompleted(r))
            .OrderBy((r: pinewoodderby.Race) => r.RaceNumber)
            .Skip(1).Take(2)
            .ToArray();
    }

    private NextRaceFrom(races: pinewoodderby.Race[]) {
        return Enumerable.From(races)
            .Where((r: pinewoodderby.Race) => !this.IsRaceCompleted(r))
            .OrderBy((r: pinewoodderby.Race) => r.RaceNumber)
            .FirstOrDefault(null);
    }

    private IsRaceCompleted(race: pinewoodderby.Race) {
        return race.Car1.Place > 0 &&
            race.Car2.Place > 0 &&
            race.Car3.Place > 0 &&
            race.Car4.Place > 0;
    }

    private createDummyRace() {
        var obj = <pinewoodderby.Tournament>new Object();
        obj.Name = "dummy";
        obj.Groups = [];
        obj.Races = [];
        return obj;
    }

    private DisplayName(car: pinewoodderby.Car) {
        if (car.Name.startsWith("BYE")) {
            return "";
        }
        return car.Name;
    }

    private DisplayIdAndCar(car: pinewoodderby.Car) {
        if (car.ID.startsWith("BYE")) {
            return "";
        }
        return car.ID + " - " + car.Builder;
    }

    private DisplayIdAndCarAndName(car: pinewoodderby.Car) {
        if (car.ID.startsWith("BYE")) {
            return "";
        }
        return car.ID + " - " + car.Builder + " - " + car.Name;
    }
}

class StandingsPage {
    public PageNumber: number;
    public GroupNumber: number;
    public GroupName: string;
    public PlaceIndex: number;
    public GroupClassName: string;
    public ShowLaneStats: boolean;

    public Title() {
        return this.GroupClassName == null ? this.GroupName : this.GroupName + ' - ' + this.GroupClassName;
    }
}