using System.Collections.Generic;
using System.Linq;

namespace PinewoodDerby.Dto
{
    public static class TournamentExtensions
    {
        public static void FillInFinalsStandings(this Tournament tournament)
        {
            if (tournament.FinalsRaces.Any(r => r.Car1.Place == 0))
            {
                return;
            }
            var finalStandings = new List<FinalStandingsGroup>();
            finalStandings.AddRange(StandingsGroup(tournament.FinalsRaces, tournament.FinalsGroups, false));
            finalStandings.AddRange(StandingsGroup(tournament.Races, tournament.Groups, true));
            tournament.FinalStandings = finalStandings.ToArray();
        }

        private static IEnumerable<FinalStandingsGroup> StandingsGroup(IEnumerable<Race> races, IEnumerable<Group> groups, bool separateByClass)
        {
            return groups.SelectMany(g => FinalStandingsGroup(races, g, separateByClass)).ToList();
        }

        private static FinalStandingsGroup[] FinalStandingsGroup(IEnumerable<Race> races, Group standingsGroup, bool separateByClass)
        {
            if (separateByClass)
            {
                var finalStandingsGroups = new List<FinalStandingsGroup>();
                var classes = standingsGroup.Cars.Select(c => c.Class).Distinct();
                foreach (var _class in classes)
                {
                    var groupName = _class ?? standingsGroup.Name;
                    var cars = standingsGroup.Cars.Where(c => c.Class == _class);
                    var finalsGroup = FinalsGroup(races, groupName, cars);
                    finalStandingsGroups.Add(finalsGroup);
                }
                return finalStandingsGroups.ToArray();
            }
            return new[] {FinalsGroup(races, standingsGroup.Name, standingsGroup.Cars)};
        }

        private static FinalStandingsGroup FinalsGroup(IEnumerable<Race> races, string groupName, IEnumerable<Car> cars)
        {
            var finalsGroup = new FinalStandingsGroup {Group = groupName};
            var results =
                from r in
                    races.SelectMany(r => r.Results()).Where(r => cars.Any(c => c.ID == r.Car.ID))
                group r by r.Car.ID
                into g
                select new FinalStandingRow
                {
                    Car = g.First().Car,
                    Points = g.Sum(rr => rr.Place == 0 ? 0 : 5 - rr.Place)
                };
            results = results.OrderByDescending(rr => rr.Points).ToArray();
            var place = 0;
            var nextPlace = 1;
            var lastTotal = 0;
            foreach (var result in results)
            {
                if (result.Points != lastTotal)
                {
                    place = nextPlace;
                }
                result.Place = place;
                nextPlace++;
                lastTotal = result.Points;
            }
            finalsGroup.Rows = results.ToArray();
            return finalsGroup;
        }
    }
}
