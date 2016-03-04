using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using AttributeRouting.Helpers;
using Newtonsoft.Json;
using Utils;

namespace PinewoodDerby.Dto
{
    public static class TournamentExtensions
    {
        public static void Save(this Tournament tournament)
        {
            File.WriteAllText(@"C:\Tournaments\{0}\tournament.{1}.json".FormatWith(tournament.Name, DateTime.Now.ToString("yyyyMMdd-hhmmss")), JsonConvert.SerializeObject(tournament, Formatting.Indented));
            File.WriteAllText(@"C:\Tournaments\{0}\tournament.json".FormatWith(tournament.Name), JsonConvert.SerializeObject(tournament, Formatting.Indented));
        }

        public static void Update(this Tournament tournament)
        {
            tournament.BuildLaneStats();
            tournament.AddTiebreakerRaces();
            tournament.AddFinalsRaces();
            tournament.FillInStandings();
        }

        public static void BuildLaneStats(this Tournament tournament)
        {
            var prelimRaces = tournament.Races.Where(r => r.Round == "prelim").ToArray();
            var laneStats = new[]
            {
                BuildLaneStat(prelimRaces, r => r.Car1, 1),
                BuildLaneStat(prelimRaces, r => r.Car2, 2),
                BuildLaneStat(prelimRaces, r => r.Car3, 3),
                BuildLaneStat(prelimRaces, r => r.Car4, 4),
            };
            tournament.LaneStats = laneStats;
        }

        private static LaneStat BuildLaneStat(Race[] races, Func<Race, RaceResult> whichCar, int laneNumber)
        {
            var laneResults = races.Select(whichCar).ToArray();
            return new LaneStat
            {
                LaneNumber = laneNumber,
                FirstPlaceFinishes = laneResults.Count(r => r.Place == 1),
                SecondPlaceFinishes = laneResults.Count(r => r.Place == 2),
                ThirdPlaceFinishes = laneResults.Count(r => r.Place == 3),
                FourthPlaceFinishes = laneResults.Count(r => r.Place == 4),
                Points = laneResults.Sum(r => r.Points),
            };
        }

        public static void AddFinalsRaces(this Tournament tournament)
        {
            if (!tournament.Races.All(r => r.IsFinished()) || tournament.Groups.Any(g => g.Name == "Finals"))
            {
                return;
            }
            var finalsCars = new List<Car>();
            var scoutGroup = tournament.Groups.First(g => g.Name == "Scouts");
            var resultsByClass = ResultsByClass(tournament, scoutGroup);
            foreach (var classGroup in resultsByClass)
            {
                var firstCar = GetFirstCar(tournament, classGroup);
                if (firstCar == null)
                {
                    return;
                }
                finalsCars.Add(firstCar.Copy());
            }
            for (int i = 0; i < finalsCars.Count; i++)
            {
                finalsCars[i].Number = i + 1;
            }

            var tournamentBuilder = new TournamentBuilder("finals", "");
            var laneStats = tournament.LaneStats;
            var finalsGroup = new Group {Name = "Finals", Round = "Finals", Cars = finalsCars.ToArray()};
            var raceDef = RaceDefinitionSource.RaceDefinitions(finalsCars.Count, 1, laneStats);
            tournamentBuilder.AddGroup(finalsGroup, raceDef);
            var finalsTournament = tournamentBuilder.Build("Finals");
            tournament.AddGroupsAndRaces(finalsTournament.Groups, finalsTournament.Races);
        }

        private static Car GetFirstCar(Tournament tournament, IGrouping<string, CarResult> classGroup)
        {
            var maxPoints = classGroup.Max(r => r.Points);
            var carsWithMaxPoints = classGroup.Where(r => r.Points == maxPoints).ToArray();
            if (carsWithMaxPoints.Count() == 1)
            {
                return carsWithMaxPoints.First().Car;
            }
            var tiebreakWinner = TiebreakWinner(tournament, classGroup);
            if (tiebreakWinner == null)
            {
                return null;
            }
            return tiebreakWinner;
        }

        private static void AddGroupsAndRaces(this Tournament tournament, Group[] groupsToAdd, Race[] racesToAdd)
        {
            var groups = tournament.Groups.ToList();
            groups.AddRange(groupsToAdd);
            var races = tournament.Races.ToList();
            races.AddRange(racesToAdd);
            for (int i = 0; i < races.Count; i++)
            {
                races[i].RaceNumber = i + 1;
            }
            tournament.Groups = groups.ToArray();
            tournament.Races = races.ToArray();
        }

        private static Car TiebreakWinner(Tournament tournament, IGrouping<string, CarResult> classGroup)
        {
            var tiebreakCount = 1;
            while (true)
            {
                var tiebreakGroupName = string.Join("-", classGroup.Key, "Tiebreaker", tiebreakCount);
                var tiebreakGroup = tournament.Groups.FirstOrDefault(g => g.Name == tiebreakGroupName);
                if (tiebreakGroup == null)
                {
                    return null;
                }
                var tiebreakResults = ResultsByClass(tournament, tiebreakGroup).First();
                var maxPoints = tiebreakResults.Max(r => r.Points);
                var carsWithMaxPoints = tiebreakResults.Where(r => r.Points == maxPoints).ToArray();
                if (carsWithMaxPoints.Count() == 1)
                {
                    return carsWithMaxPoints.First().Car;
                }
                tiebreakCount++;
            }
        }

        public static void AddTiebreakerRaces(this Tournament tournament)
        {
            int byeCounter = 0;
            if (!tournament.Races.All(r => r.IsFinished()))
            {
                return;
            }
            var tiebreakerRounds = tournament.Groups.Select(g => g.Round).Where(r => r != null && r.Contains("Tiebreaker"));
            var tiebreakerRound = 0;
            foreach (var round in tiebreakerRounds)
            {
                var thisRound = round.Split('-').Last().ToInt();
                tiebreakerRound = Math.Max(thisRound, tiebreakerRound);
            }
            var roundName = "Tiebreaker-" + (tiebreakerRound + 1);
            var tiebreakerTournamentBuilder = new TournamentBuilder(tournament.Name + " - tiebreakers", "");
            var laneStats = tournament.LaneStats;
            foreach (var g in tournament.Groups)
            {
                var resultsByClass = ResultsByClass(tournament, g);

                foreach (var classGroup in resultsByClass)
                {
                    var maxPoints = classGroup.Max(r => r.Points);
                    var carsWithMaxPoints = classGroup.Where(r => r.Points == maxPoints).ToArray();
                    var baseGroup = g.ShowClassStandings ? classGroup.Key : g.Name;
                    if (carsWithMaxPoints.Count() > 1 && !tournament.Groups.Any(_g => _g.TiebreakGroup == baseGroup))
                    {
                        int i = 1;
                        var tiedCars =
                            carsWithMaxPoints.Select(
                                c =>
                                    new Car
                                    {
                                        Builder = c.Car.Builder,
                                        Class = c.Car.Class,
                                        ID = c.Car.ID,
                                        Name = c.Car.Name,
                                        Number = i++
                                    }).ToList();
                        var raceDef = RaceDefinitionSource.RaceDefinitions(tiedCars.Count(), 1, laneStats);
                        while (tiedCars.Count() < 4)
                        {
                            byeCounter++;
                            var carId = "BYE" + byeCounter;
                            tiedCars.Add(new Car { Builder = carId, Name = carId, ID = carId, Number = i });
                            i++;
                        }
                        var name = string.Join("-", baseGroup.Split('-').First(), roundName);
                        var tiedGroup = new Group { Name = name, Cars = tiedCars.ToArray(), Round = roundName, TiebreakGroup = baseGroup};
                        tiebreakerTournamentBuilder.AddGroup(tiedGroup, raceDef);
                    }
                }
            }
            var tiebreakerTournament = tiebreakerTournamentBuilder.Build(roundName);
            tournament.AddGroupsAndRaces(tiebreakerTournament.Groups, tiebreakerTournament.Races);
        }

        private static IEnumerable<IGrouping<string, CarResult>> ResultsByClass(Tournament tournament, Group g)
        {
            var racesInGroup = tournament.Races.Where(r => r.Group == g.Name).ToArray();
            var carResults = racesInGroup.SelectMany(r => new[] {r.Car1, r.Car2, r.Car3, r.Car4});
            var carResultsByCar = from r in carResults
                group r by r.Car.ID
                into _g
                select
                    new CarResult(_g.First().Car, _g.Count(r => r.Place == 1), _g.Count(r => r.Place == 2),
                        _g.Count(r => r.Place == 3), _g.Count(r => r.Place == 4), _g.Count());
            var resultsByClass = from result in carResultsByCar
                group result by g.ShowClassStandings ? result.Car.Class : ""
                into _g
                select _g;
            return resultsByClass;
        }

        public static void FillInStandings(this Tournament tournament)
        {
            var rounds = tournament.Groups.Select(g => g.Round).Distinct();
            var standings = new List<GroupStandings>();
            foreach (var round in rounds)
            {
                standings.AddRange(FillInStandingsForRound(round, tournament.Races, tournament.Groups));
            }

            tournament.Standings = standings.ToArray();
        }

        public static IEnumerable<GroupStandings> FillInStandingsForRound(string round, IEnumerable<Race> races, IEnumerable<Group> groups)
        {
            var groupList = new List<GroupStandings>();
            var roundRaces = races.Where(r => r.Round == round).ToArray();
            foreach (var g in groups.Where(_g => _g.Round == round))
            {
                var groupResults = g.Cars.Select(c =>
                {
                    var raceResults = roundRaces.SelectMany(r => r.Results()).Where(rr => rr.Car.ID == c.ID).ToArray();
                    var firstPlaceFinishes = raceResults.Count(rr => rr.Place == 1);
                    var secondPlaceFinishes = raceResults.Count(rr => rr.Place == 2);
                    var thirdPlaceFinishes = raceResults.Count(rr => rr.Place == 3);
                    var fourthPlaceFinishes = raceResults.Count(rr => rr.Place == 4);
                    var totalRaces = raceResults.Count();
                    return new GroupStandingsRow
                    {
                        Car = c,
                        FirstPlaceFinishes = firstPlaceFinishes,
                        SecondPlaceFinishes = secondPlaceFinishes,
                        ThirdPlaceFinishes = thirdPlaceFinishes,
                        FourthPlaceFinishes = fourthPlaceFinishes,
                        TotalRaces = totalRaces,
                        RacesRemaining = totalRaces-firstPlaceFinishes-secondPlaceFinishes-thirdPlaceFinishes-fourthPlaceFinishes,
                        Points =
                            firstPlaceFinishes*4 + secondPlaceFinishes*3 + thirdPlaceFinishes*2 + fourthPlaceFinishes*1,
                    };
                }).OrderByDescending(rr => rr.Points)
                    .ThenByDescending(rr => rr.RacesRemaining)
                    .ThenByDescending(rr => rr.FirstPlaceFinishes)
                    .ThenByDescending(rr => rr.SecondPlaceFinishes)
                    .ThenByDescending(rr => rr.ThirdPlaceFinishes)
                    .ThenByDescending(rr => rr.FourthPlaceFinishes)
                    .ToArray();
                FillInPlaces(groupResults);
                groupList.Add(new GroupStandings
                {
                    Round = round,
                    Group = g.Name,
                    StandingsRows = groupResults,
                });
                if (g.ShowClassStandings)
                {
                    var classes = g.Cars.Select(c => c.Class).Distinct();
                    foreach (var _class in classes)
                    {
                        var classRows = groupResults.Where(r => r.Car.Class == _class).Select(r => r.Copy()).ToArray();
                        FillInPlaces(classRows);
                        groupList.Add(new GroupStandings
                        {
                            Round = round, 
                            Group = string.Join(" - ", g.Name, _class),
                            StandingsRows = classRows,
                        });
                    }
                }
            }
            return groupList;
        }

        private static void FillInPlaces(GroupStandingsRow[] groupResults)
        {
            var place = 0;
            var lastPoints = int.MaxValue;
            for (var i = 0; i < groupResults.Length; i++)
            {
                if (groupResults[i].Points != lastPoints)
                {
                    place = i + 1;
                    lastPoints = groupResults[i].Points;
                }
                groupResults[i].Place = place;
            }
        }
    }

    public class CarResult
    {
        private readonly Car _car;
        private readonly int _firstPlaceFinishes;
        private readonly int _secondPlaceFinishes;
        private readonly int _thirdPlaceFinishes;
        private readonly int _fourthPlaceFinishes;
        private readonly int _totalRaces;

        public Car Car
        {
            get { return _car; }
        }

        public int FirstPlaceFinishes
        {
            get { return _firstPlaceFinishes; }
        }

        public int SecondPlaceFinishes
        {
            get { return _secondPlaceFinishes; }
        }

        public int ThirdPlaceFinishes
        {
            get { return _thirdPlaceFinishes; }
        }

        public int FourthPlaceFinishes
        {
            get { return _fourthPlaceFinishes; }
        }

        public int TotalRaces
        {
            get { return _totalRaces; }
        }

        public int Points
        {
            get { return 4 * _firstPlaceFinishes + 3 * _secondPlaceFinishes + 2 * _thirdPlaceFinishes + 1 * _fourthPlaceFinishes; }
        }

        public CarResult(Car car, int firstPlaceFinishes, int secondPlaceFinishes, int thirdPlaceFinishes, int fourthPlaceFinishes, int totalRaces)
        {
            _car = car;
            _firstPlaceFinishes = firstPlaceFinishes;
            _secondPlaceFinishes = secondPlaceFinishes;
            _thirdPlaceFinishes = thirdPlaceFinishes;
            _fourthPlaceFinishes = fourthPlaceFinishes;
            _totalRaces = totalRaces;
        }
    }

}
