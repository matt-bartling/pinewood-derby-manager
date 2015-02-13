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
            $.getJSON(this.baseUrl + "api/derbymanager/gettournament", (response: Common.ApiResponse<pinewoodderby.Tournament>) => {
                this.Tournament(response.Content);
                var pageNumber = 0;
                this.StandingsPages = [];
                for (var n = 0; n < this.Tournament().Groups.length; n++) {
                    var group = this.Tournament().Groups[n];
                    var startPlace = 0;
                    while (startPlace < group.Cars.length) {
                        var standingsPage = new StandingsPage();
                        standingsPage.GroupNumber = n;
                        standingsPage.PageNumber = pageNumber;
                        standingsPage.PlaceIndex = startPlace;
                        this.StandingsPages.push(standingsPage);
                        startPlace += 10;
                        pageNumber++;
                    }
                }
                this.SetNextRace();
                this.SetPageNumber(0);
                this.SetNextResult();
            });
        });
        setInterval(() => { this.SetNextResult(); }, 5000);
        setInterval(() => { this.SetNextStandingsPage(); }, 15000);
    }

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

    private SetNextStandingsPage() {
        var pageNumber = ((this.CurrentStandingsPage + 1) % this.StandingsPages.length);
        this.SetPageNumber(pageNumber);
    }

    private Standings_NextPage() {
        this.SetNextStandingsPage();
    }

    private Standings_PrevPage() {
        var pageNumber = this.CurrentStandingsPage == 0 ? this.StandingsPages.length - 1 : this.CurrentStandingsPage - 1;
        this.SetPageNumber(pageNumber);
    }

    private SetPageNumber(pageNumber: number) {
        $('#standings-container').fadeOut('fast', 'swing', () => {
            this.CurrentStandingsPage = pageNumber;
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
            var racesWithCar = Enumerable.From(races).Where((r) => this.ContainsCar(r, c)).ToArray();
            var result = new GroupStandingsRow();
            result.Car = c;
            result.TotalRaces = racesWithCar.length;
            result.FirstPlaceFinishes = Enumerable.From(racesWithCar).Count((r: pinewoodderby.Race) => r.First != null && r.First.ID == c.ID && r.First.Name == c.Name);
            result.SecondPlaceFinishes = Enumerable.From(racesWithCar).Count((r: pinewoodderby.Race) => r.Second != null && r.Second.ID == c.ID && r.Second.Name == c.Name);
            result.ThirdPlaceFinishes = Enumerable.From(racesWithCar).Count((r: pinewoodderby.Race) => r.Third != null && r.Third.ID == c.ID && r.Third.Name == c.Name);
            result.FourthPlaceFinishes = Enumerable.From(racesWithCar).Count((r: pinewoodderby.Race) => r.Fourth != null && r.Fourth.ID == c.ID && r.Fourth.Name == c.Name);
            result.RacesRemaining = result.TotalRaces - result.FirstPlaceFinishes - result.SecondPlaceFinishes - result.ThirdPlaceFinishes - result.FourthPlaceFinishes;
            result.Points = 4 * result.FirstPlaceFinishes + 3 * result.SecondPlaceFinishes + 2 * result.ThirdPlaceFinishes + 1 * result.FourthPlaceFinishes;
            results.push(result);
        });
        var standings = Enumerable.From(results)
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
            .Take(10)
            .ToArray();
        this.GroupStandings(standings);
        this.DisplayedGroup(group);
    }

    private ContainsCar(race: pinewoodderby.Race, car: pinewoodderby.Car) {
        return race.Car1.ID == car.ID ||
            race.Car2.ID == car.ID ||
            race.Car3.ID == car.ID ||
            race.Car4.ID == car.ID;
    }

    private Tournament = ko.observable<pinewoodderby.Tournament>();
    private Title = ko.observable("title");
    private CurrentRace = ko.observable<pinewoodderby.Race>();
    private NextFourRaces = ko.observableArray<pinewoodderby.Race>();
    private DisplayedRaceResult = ko.observableArray<pinewoodderby.Race>([]);
    private DisplayedRaceNumber = 0;
    private DisplayedGroup = ko.observable<pinewoodderby.Group>();
    private GroupStandings = ko.observableArray<GroupStandingsRow>([]);

    private First = ko.observable<pinewoodderby.Car>();
    private Second = ko.observable<pinewoodderby.Car>();
    private Third = ko.observable<pinewoodderby.Car>();
    private Fourth = ko.observable<pinewoodderby.Car>();

    private CurrentStandingsPage = 0;
    private StandingsPages: StandingsPage[];

    private CurrentRace_CarClick(car: pinewoodderby.Car) {
        if (this.First() == car ||
            this.Second() == car ||
            this.Third() == car ||
            this.Fourth() == car) {
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
    }

    private CurrentRace_AllPlacesSelected() {
        return (this.First() != null && this.First().Name != null) &&
            (this.Second() != null && this.Second().Name != null) &&
            (this.Third() != null && this.Third().Name != null) &&
            (this.Fourth() != null && this.Fourth().Name != null);
    }

    private CurrentRace_ClearPlaces() {
        this.First(null);
        this.Second(null);
        this.Third(null);
        this.Fourth(null);
    }

    private CurrentRace_Save() {
        this.CurrentRace().First = this.First();
        this.CurrentRace().Second = this.Second();
        this.CurrentRace().Third = this.Third();
        this.CurrentRace().Fourth = this.Fourth();

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
        return race.First != null && race.First.Name != null &&
            race.Second != null && race.Second.Name != null &&
            race.Third != null && race.Third.Name != null &&
            race.Fourth != null && race.Fourth.Name != null;
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

class StandingsPage {
    public PageNumber: number;
    public GroupNumber: number;
    public PlaceIndex: number;
}