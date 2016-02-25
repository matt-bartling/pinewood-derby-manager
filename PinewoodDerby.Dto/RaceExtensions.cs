namespace PinewoodDerby.Dto
{
    public static class RaceExtensions
    {
        public static RaceResult[] Results(this Race race)
        {
            return new[] {race.Car1, race.Car2, race.Car3, race.Car4};
        }
    }
}