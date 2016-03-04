namespace PinewoodDerby.Dto
{
    public static class RaceExtensions
    {
        public static RaceResult[] Results(this Race race)
        {
            return new[] {race.Car1, race.Car2, race.Car3, race.Car4};
        }

        public static bool IsFinished(this Race race)
        {
            return race.Car1.Place > 0 &&
                   race.Car2.Place > 0 &&
                   race.Car3.Place > 0 &&
                   race.Car4.Place > 0;
        }

        public static void SetPlace(this RaceResult raceResult, int place)
        {
            raceResult.Place = place;
            raceResult.Points = 5 - place;
        }
    }
}