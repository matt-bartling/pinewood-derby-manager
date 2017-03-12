using System.Web;
using System.Web.Optimization;

namespace PinewoodDerby
{
    public class BundleConfig
    {
        // For more information on bundling, visit http://go.microsoft.com/fwlink/?LinkId=301862
        public static void RegisterBundles(BundleCollection bundles)
        {
            bundles.IgnoreList.Clear();
            bundles.IgnoreList.Ignore("*.intellisense.js");
            bundles.IgnoreList.Ignore("*-vsdoc.js");
            bundles.IgnoreList.Ignore("*.debug.js", OptimizationMode.WhenEnabled);
            bundles.IgnoreList.Ignore("*.min.css", OptimizationMode.WhenDisabled);

            var scripts = new ScriptBundle("~/bundles/scripts")
                .Include("~/Scripts/jquery-{version}.js")
                .Include("~/Scripts/bootstrap.js")
                .Include("~/Scripts/knockout-{version}.js")
                .Include("~/Scripts/knockout.mapping-latest.js")
                .Include("~/Scripts/sugar.min.js")
                .Include("~/Scripts/accounting.min.js")
                .Include("~/Scripts/linq.min.js")
                .Include("~/Scripts/moment.min.js")
                .Include("~/Scripts/Common/customBindings.js")
                .Include("~/Scripts/stickyTableHeader.js");

            bundles.Add(scripts);

            bundles.Add(new StyleBundle("~/Content/css").Include(
                      "~/Content/bootstrap.css",
                      "~/Content/site.css",
                      "~/Content/navbar.css",
                      "~/Content/upcoming-races.css",
                      "~/Content/current-race.css",
                      "~/Content/race-results.css",
                      "~/Content/standings.css"));

            // Set EnableOptimizations to false for debugging. For more information,
            // visit http://go.microsoft.com/fwlink/?LinkId=301862
            BundleTable.EnableOptimizations = true;
        }
    }
}
