using System;
using System.Collections.Generic;

namespace Utils
{
    public static class IntExtensions
    {
        public static IEnumerable<int> To(this int start, int end)
        {
            if (end < start)
            {
                return new int[0];
            }
            var ints = new int[end - start + 1];
            for (var i = 0; i < ints.Length; i++)
            {
                ints[i] = i + start;
            }
            return ints;
        }

        public static int ToInt(this double d)
        {
            return Convert.ToInt32(d);
        }

        public static int ToInt(this string s)
        {
            return Convert.ToInt32(s);
        }
    }
}
