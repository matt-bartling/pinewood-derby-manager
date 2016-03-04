using System;
using System.Collections.Generic;
using System.Linq;

namespace Utils
{
    public static class ArrayExtensions
    {
        public static T[] Copy<T>(this T[] _this)
        {
            var copy = new T[_this.Length];
            for (var i = 0; i < _this.Length; i++)
            {
                copy[i] = _this[i];
            }
            return copy;
        }
    }
    public static class EnumerableExtensions
    {
        public static Random R = new Random();
        public static IList<T> RandomSort<T>(this IList<T> list)
        {
            return
                list.Select(t => new Tuple<T, double>(t, new Random().NextDouble()))
                    .OrderBy(tp => tp.Item2)
                    .Select(tp => tp.Item1)
                    .ToArray();
        }

        public static IList<T> RandomOrder<T>(this IList<T> list)
        {
            return
                list.Select(t => new Tuple<T, double>(t, R.NextDouble()))
                    .OrderBy(tp => tp.Item2)
                    .Select(tp => tp.Item1)
                    .ToArray();
        }

        public static T MinR<T, U>(this IEnumerable<T> list, Func<T, U> selector)
            where U : IComparable<U>
        {
            T min = list.FirstOrDefault();
            foreach (var t in list)
            {
                if (selector(t).CompareTo(selector(min)) < 0)
                {
                    min = t;
                }
            }
            return min;
        }

        public static T MaxR<T, U>(this IEnumerable<T> list, Func<T, U> selector)
        where U : IComparable<U>
        {
            T max = list.FirstOrDefault();
            foreach (var t in list)
            {
                if (selector(t).CompareTo(selector(max)) > 0)
                {
                    max = t;
                }
            }
            return max;
        }
    }
}
