using System;
using System.Collections.Generic;
using System.Linq;

namespace Utils
{
    public static class EnumerableExtensions
    {
        public static IList<T> RandomSort<T>(this IList<T> list)
        {
            return
                list.Select(t => new Tuple<T, double>(t, new Random().NextDouble()))
                    .OrderBy(tp => tp.Item2)
                    .Select(tp => tp.Item1)
                    .ToArray();
        } 
    }
}
