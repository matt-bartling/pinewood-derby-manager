using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Web;
using System.Web.Http;
using System.Web.Http.Filters;
using AttributeRouting.Helpers;
using AttributeRouting.Web.Http;
using Newtonsoft.Json;
using PinewoodDerby.Dto;
using Utils.Web.Api;

namespace PinewoodDerby.Controllers.API
{
    [RoutePrefix("api/derbymanager")]
    public class DerbyManagerController : ApiController
    {
        [HttpGet]
        [Route("gettournament")]
        public HttpResponseMessage GetTournament(string name = "Pack 125 - 2015")
        {
            var tournament =
                JsonConvert.DeserializeObject<Tournament>(File.ReadAllText(@"C:\Tournaments\{0}\tournament.json".FormatWith(name)));
            tournament.FillInFinalsStandings();
            return ApiResponse.SuccessResponse(Request, tournament);
        }

        [POST("savetournament")]
        public HttpResponseMessage SaveTournament(Tournament tournament)
        {
            File.WriteAllText(@"C:\Tournaments\{0}\tournament.{1}.json".FormatWith(tournament.Name, DateTime.Now.ToString("yyyyMMdd-hhmmss")), JsonConvert.SerializeObject(tournament, Formatting.Indented));
            File.WriteAllText(@"C:\Tournaments\{0}\tournament.json".FormatWith(tournament.Name), JsonConvert.SerializeObject(tournament, Formatting.Indented));
            tournament.FillInFinalsStandings();
            return ApiResponse.SuccessResponse(Request, tournament);
        }

        [HttpGet]
        [Route("getavailabletournaments")]
        public HttpResponseMessage GetAvailableTournaments()
        {
            var tournements = Directory.GetDirectories(@"C:\Tournaments").Select(d => new DirectoryInfo(d).Name);
            return ApiResponse.SuccessResponse(Request, new AvailableTournaments{Names = tournements.ToArray()});
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
                get { return 4*_firstPlaceFinishes + 3*_secondPlaceFinishes + 2*_thirdPlaceFinishes + 1*_fourthPlaceFinishes; }
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

        [HttpGet]
        [Route("create-tiebreakers")]
        public HttpResponseMessage CreateTiebreakers(string name = "test - 2016")
        {
            var tournament =
                JsonConvert.DeserializeObject<Tournament>(
                    File.ReadAllText(@"C:\Tournaments\{0}\tournament.json".FormatWith(name)));
            var tiebreakerTournamentBuilder = new TournamentBuilder(name + " - tiebreakers", "");
            var laneStats = tournament.LaneStats();
            foreach (var g in tournament.Groups)
            {
                var racesInGroup = tournament.Races.Where(r => r.Group == g.Name).ToArray();
                var carResults = racesInGroup.SelectMany(r => new[]{ r.Car1, r.Car2, r.Car3, r.Car4});
                var carResultsByCar = from r in carResults
                    group r by r.Car.ID
                    into _g
                    select
                        new CarResult(_g.First().Car, _g.Count(r => r.Place == 1), _g.Count(r => r.Place == 2),
                            _g.Count(r => r.Place == 3), _g.Count(r => r.Place == 4), _g.Count());
                var resultsByClass = from result in carResultsByCar
                    group result by result.Car.Class
                    into _g
                    select _g;

                foreach (var classGroup in resultsByClass)
                {
                    var maxPoints = classGroup.Max(r => r.Points);
                    var carsWithMaxPoints = classGroup.Where(r => r.Points == maxPoints).ToArray();
                    if (carsWithMaxPoints.Count() > 1)
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
                            var carId = "BYE" + i;
                            tiedCars.Add(new Car { Builder = carId, Name = carId, ID = carId, Number = i });
                            i++;
                        }
                        var tiedGroup = new Group() { Name = classGroup.Key ?? g.Name, Cars = tiedCars.ToArray() };
                        tiebreakerTournamentBuilder.AddGroup(tiedGroup, raceDef);
                    }
                }
            }
            var tiebreakerTournament = tiebreakerTournamentBuilder.Build();
            tournament.TiebreakerGroups = tiebreakerTournament.Groups;
            tournament.TiebreakerRaces = tiebreakerTournament.Races;
            SaveTournament(tournament);
            return ApiResponse.SuccessResponse(Request, tournament);
        }

        [HttpGet]
        [Route("create-finals")]
        public HttpResponseMessage CreateFinals(string name = "test - 2016")
        {
            var tournament =
                JsonConvert.DeserializeObject<Tournament>(
                    File.ReadAllText(@"C:\Tournaments\{0}\tournament.json".FormatWith(name)));
            var finalTournamentBuilder = new TournamentBuilder(name + " - finals", "");
            var laneStats = tournament.LaneStats();
            var scoutGroup = tournament.Groups.First(g => g.Name == "Scouts");
            var finalsCars = new List<Car>();
                var resultsByClass = ResultsByClass(tournament.Races, scoutGroup.Name);

            int i = 0;
            foreach (var classGroup in resultsByClass)
            {
                i++;
                var maxPoints = classGroup.Max(r => r.Points);
                var carsWithMaxPoints = classGroup.Where(r => r.Points == maxPoints).ToArray();
                var topCar = TopCar(carsWithMaxPoints, tournament, classGroup);
                finalsCars.Add(new Car { Builder = topCar.Builder, Name = topCar.Name, ID = topCar.ID, Class = topCar.Class, Number = i, });
            }
            var raceDef = RaceDefinitionSource.RaceDefinitions(finalsCars.Count(), 1, laneStats);
            var tiedGroup = new Group() { Name = "Finals", Cars = finalsCars.ToArray() };
            finalTournamentBuilder.AddGroup(tiedGroup, raceDef);

            var tiebreakerTournament = finalTournamentBuilder.Build();
            tournament.FinalsGroups = tiebreakerTournament.Groups;
            tournament.FinalsRaces = tiebreakerTournament.Races;
            SaveTournament(tournament);
            return ApiResponse.SuccessResponse(Request, tournament);
        }

        private static Car TopCar(CarResult[] carsWithMaxPoints, Tournament tournament, IGrouping<string, CarResult> classGroup)
        {
            if (carsWithMaxPoints.Count() == 1)
            {
                return carsWithMaxPoints.First().Car;
            }
            var tiebreakerResults =
                ResultsByClass(tournament.TiebreakerRaces, classGroup.Key).SelectMany(g => g.ToArray()).ToArray();
            var tiebreakerMaxPoints = tiebreakerResults.Max(r => r.Points);
            return tiebreakerResults.First(r => r.Points == tiebreakerMaxPoints).Car;
        }

        private static IEnumerable<IGrouping<string, CarResult>> ResultsByClass(IEnumerable<Race> races, string groupName)
        {
            var racesInGroup = races.Where(r => r.Group == groupName).ToArray();
            var carResults = racesInGroup.SelectMany(r => new[] {r.Car1, r.Car2, r.Car3, r.Car4});
            var carResultsByCar = from r in carResults
                group r by r.Car.ID
                into _g
                select
                    new CarResult(_g.First().Car, _g.Count(r => r.Place == 1), _g.Count(r => r.Place == 2),
                        _g.Count(r => r.Place == 3), _g.Count(r => r.Place == 4), _g.Count());
            var resultsByClass = from result in carResultsByCar
                group result by result.Car.Class
                into _g
                select _g;
            return resultsByClass;
        }
    }
}