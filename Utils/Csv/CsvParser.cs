using System.Collections.Generic;
using System.IO;
using LumenWorks.Framework.IO.Csv;

namespace Utils.Csv
{
    public class CsvParser
    {
        public static IList<T> ParseArray<T>(string fileName, bool hasHeaders = false)
            where T : IFromCsv, new()
        {
            var list = new List<T>();
            using (var reader = new CsvReader(new StreamReader(fileName), hasHeaders, '\t'))
            {
                while (reader.ReadNextRecord())
                {
                    var strings = new string[reader.FieldCount];
                    reader.CopyCurrentRecordTo(strings);
                    var t = new T();
                    t.Fill(strings);
                    list.Add(t);
                }
            }
            return list;
        } 
    }
}
