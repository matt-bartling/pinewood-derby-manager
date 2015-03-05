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
            this.LoadTournament('Pack 125 - 2015');
        });
        $(document).keypress((event) => {
            var place = event.charCode - 48;
            if (place < 1 || place > 4) {
                return;
            }

            if (this.SelectedLane != null) {
                console.log(this.SelectedLane());
                this.SelectedLane(place);
                console.log(this.SelectedLane());
            }
        });
        setInterval(() => { this.SetNextResult(); }, 5000);
        setInterval(() => { this.SetNextStandingsPage(false); }, 15000);
        this.LoadAvailableTournaments();
        setInterval(() => this.LoadAvailableTournaments(), 5000);
    }

    public LoadTournament(name: string) {
        $.getJSON(this.baseUrl + "api/derbymanager/gettournament?name="+name, (response: Common.ApiResponse<pinewoodderby.Tournament>) => {
            this.Tournament(response.Content);
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
            this.SetPageNumber(0);
            this.SetNextResult();
        });
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
        var results = [];
        var races = this.Tournament().Races;
        group.Cars.forEach((c: pinewoodderby.Car) => {
            var raceResults = Enumerable.From(races).SelectMany((r: pinewoodderby.Race) => [r.Car1, r.Car2, r.Car3, r.Car4]).ToArray();
            var resultsWithCar = Enumerable.From(raceResults).Where((rr: pinewoodderby.RaceResult) => rr.Car.ID == c.ID).ToArray();
            var result = new GroupStandingsRow();
            result.Car = c;
            result.TotalRaces = resultsWithCar.length;
            result.FirstPlaceFinishes = Enumerable.From(resultsWithCar).Count((r: pinewoodderby.RaceResult) => r.Place == 1);
            result.SecondPlaceFinishes = Enumerable.From(resultsWithCar).Count((r: pinewoodderby.RaceResult) => r.Place == 2);
            result.ThirdPlaceFinishes = Enumerable.From(resultsWithCar).Count((r: pinewoodderby.RaceResult) => r.Place == 3);
            result.FourthPlaceFinishes = Enumerable.From(resultsWithCar).Count((r: pinewoodderby.RaceResult) => r.Place == 4);
            result.RacesRemaining = result.TotalRaces - result.FirstPlaceFinishes - result.SecondPlaceFinishes - result.ThirdPlaceFinishes - result.FourthPlaceFinishes;
            result.Points = 4 * result.FirstPlaceFinishes + 3 * result.SecondPlaceFinishes + 2 * result.ThirdPlaceFinishes + 1 * result.FourthPlaceFinishes;
            results.push(result);
        });
        var standings = Enumerable.From(results)
            .Where((r: GroupStandingsRow) => pageInfo.GroupClassName == null || r.Car.Class == pageInfo.GroupClassName)
            .OrderByDescending((r) => r.Points)
            .ToArray();

        var lastPoints = -1;
        var lastPlaceAssigned = -1;
        for (var i = 0; i < standings.length; i++) {
            var row = standings[i];
            if (row.Points == lastPoints) {
                row.Place = lastPlaceAssigned;
            }
            else {
                row.Place = i + 1;
                lastPoints = row.Points;
                lastPlaceAssigned = row.Place;
            }
        }

        var standings = Enumerable.From(standings)
            .OrderByDescending((r: GroupStandingsRow) => r.Points)
            .ThenByDescending((r) => r.RacesRemaining)
            .Skip(pageInfo.PlaceIndex)
            .Take(this.StandingsPageSize)
            .ToArray();
        this.GroupStandings(standings);
        this.DisplayedGroup(group);
    }

    private LaneStats() {
        var lane1 = new LaneStatsRow();
        lane1.Lane = "Lane 1";
        var lane2 = new LaneStatsRow();
        lane2.Lane = "Lane 2";
        var lane3 = new LaneStatsRow();
        lane3.Lane = "Lane 3";
        var lane4 = new LaneStatsRow();
        lane4.Lane = "Lane 4";
        var races = Enumerable.From(this.Tournament().Races)
            .Where((x: pinewoodderby.Race) => this.IsRaceCompleted(x))
            .ToArray();
        races.forEach((r: pinewoodderby.Race) => {
            this.AddLaneResult(r.Car1, r, lane1);
            this.AddLaneResult(r.Car2, r, lane2);
            this.AddLaneResult(r.Car3, r, lane3);
            this.AddLaneResult(r.Car4, r, lane4);
        });
        return Enumerable.From([lane1, lane2, lane3, lane4])
            .OrderByDescending((l: LaneStatsRow) => l.Points)
            .ToArray();
    }

    private AddLaneResult(laneCar: pinewoodderby.RaceResult, race: pinewoodderby.Race, laneStats: LaneStatsRow) {
        if (laneCar.Place == 1) {
            laneStats.Points += 4;
            laneStats.FirstPlaceFinishes++;
        }
        if (laneCar.Place == 2) {
            laneStats.Points += 3;
            laneStats.SecondPlaceFinishes++;
        }
        if (laneCar.Place == 3) {
            laneStats.Points += 2;
            laneStats.ThirdPlaceFinishes++;
        }
        if (laneCar.Place == 4) {
            laneStats.Points += 1;
            laneStats.FourthPlaceFinishes++;
        }   
    }

    private ContainsCar(race: pinewoodderby.Race, car: pinewoodderby.Car) {
        return race.Car1.Car.ID == car.ID ||
            race.Car2.Car.ID == car.ID ||
            race.Car3.Car.ID == car.ID ||
            race.Car4.Car.ID == car.ID;
    }

    private Tournament = ko.observable<pinewoodderby.Tournament>();
    private Title = ko.observable("title");
    private CurrentRace = ko.observable<pinewoodderby.Race>();
    private NextFourRaces = ko.observableArray<pinewoodderby.Race>();
    private DisplayedRaceResult = ko.observableArray<pinewoodderby.Race>([]);
    private DisplayedRaceNumber = 0;
    private DisplayedGroup = ko.observable<pinewoodderby.Group>();
    private GroupStandings = ko.observableArray<GroupStandingsRow>([]);
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
        console.log(this.LanePlaces());
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

        $.post(this.baseUrl + "api/derbymanager/savetournament", this.Tournament())
            .done(() => {
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
            var nextRace = Enumerable.From(this.Tournament().Races)
                .Where((r: pinewoodderby.Race) => !this.IsRaceCompleted(r))
                .OrderBy((r: pinewoodderby.Race) => r.RaceNumber)
                .FirstOrDefault(null);
            this.CurrentRace(nextRace);
            this.CurrentRace_ClearPlaces();
            $('#current-race-container').fadeIn('fast', 'swing');
            $('#current-race-container').css({ opacity: 1.0 });
        });
        $('#upcoming-races-container').fadeOut('fast', 'linear', () => {
            var nextFourRaces = Enumerable.From(this.Tournament().Races)
                .Where((r: pinewoodderby.Race) => !this.IsRaceCompleted(r))
                .OrderBy((r: pinewoodderby.Race) => r.RaceNumber)
                .Skip(1).Take(4)
                .ToArray();
            this.NextFourRaces(nextFourRaces);
            $('#upcoming-races-container').fadeIn('fast', 'linear');
        });
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
}

class GroupStandingsRow {
    public Car: pinewoodderby.Car;
    public FirstPlaceFinishes: number;
    public SecondPlaceFinishes: number;
    public ThirdPlaceFinishes: number;
    public FourthPlaceFinishes: number;
    public TotalRaces: number;
    public RacesRemaining: number;
    public Points: number;
    public Place: number;
}

class LaneStatsRow {
    public Lane: string;
    public FirstPlaceFinishes: number;
    public SecondPlaceFinishes: number;
    public ThirdPlaceFinishes: number;
    public FourthPlaceFinishes: number;
    public TotalRaces: number;
    public Points: number;

    constructor() {
        this.FirstPlaceFinishes = 0;
        this.SecondPlaceFinishes = 0;
        this.ThirdPlaceFinishes = 0; 
        this.FourthPlaceFinishes = 0;
        this.Points = 0;
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