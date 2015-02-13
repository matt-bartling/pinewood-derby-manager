/**
 * knockout.bindingHandlers.dataTable.js v1.0
 *
 * Copyright (c) 2011, Josh Buckley (joshbuckley.co.uk).
 * License: MIT (http://www.opensource.org/licenses/mit-license.php)
 * 
 * Example Usage:
 *
 * Using only a data souce. See http://jsfiddle.net/vB3Aj/ for demo
 *     <table data-bind="dataTable: myData">...
 *
 * Using object syntax to apply options to DataTables. 
 * See http://jsfiddle.net/tdppH/1/ for demo
 *     <table data-bind="dataTable: {data: myData, options: { key: val } }">
 */
(function($) {

    $.fn.dataTableExt.oApi.fnGetColumnData = function(oSettings, iColumn, bUnique, bFiltered, bIgnoreEmpty) {
        // check that we have a column id
        if (typeof iColumn == "undefined") return new Array();

        // by default we only want unique data
        if (typeof bUnique == "undefined") bUnique = true;

        // by default we do want to only look at filtered data
        if (typeof bFiltered == "undefined") bFiltered = true;

        // by default we do not want to include empty values
        if (typeof bIgnoreEmpty == "undefined") bIgnoreEmpty = true;

        // list of rows which we're going to loop through
        var aiRows;

        // use only filtered rows
        if (bFiltered == true) aiRows = oSettings.aiDisplay;
            // use all rows
        else aiRows = oSettings.aiDisplayMaster; // all row numbers

        // set up data array   
        var asResultData = new Array();

        for (var i = 0, c = aiRows.length; i < c; i++) {
            iRow = aiRows[i];
            var aData = this.fnGetData(iRow);
            var sValue = aData[iColumn];

            // ignore empty values?
            if (bIgnoreEmpty == true && (sValue == null)) continue;
 
                // ignore unique values?
            else if (bUnique == true && jQuery.inArray(sValue, asResultData) > -1) continue;
         
                // else push the value onto the result data array
            else asResultData.push(sValue);
        }

        return asResultData;
    };

    function fnCaseInsensitiveCompare( a, b )
    {
        var al=a.toLowerCase(),bl=b.toLowerCase();
        return al==bl?(a==b?0:a<b?-1:1):al<bl?-1:1;
    }
    
    function fnUnformatNumber(a) {
        a = (a === "-" || a === "") ? 0 : a.replace(/[^\d\-\.]/g, "");
        return parseFloat(a);
    }
    
    function fnNumericCompare(a, b) {
        var a1 = fnUnformatNumber(a), b1 = fnUnformatNumber(b);
        return a1 - b1;
    }

    function fnCreateSelect(aData, className) {
        var sortedData = aData.sort(fnCaseInsensitiveCompare),
            r = '<select><option value=""></option>', i, iLen = sortedData.length;
        if (className.indexOf("numeric-comma") > -1 ) {
            sortedData = aData.sort(fnNumericCompare);
        }
        for (i = 0; i < iLen; i++) {
            var val = sortedData[i];

            if (val === '' || val.toLowerCase() == "null") {
                val = '(Blanks)';
            }
            r += '<option value="' + val + '">' + val + '</option>';
        }
        return r + '</select>';
    }

    jQuery.fn.dataTableExt.oSort['numeric-comma-asc'] = function (a, b) {
        var x = (a == "-") ? 0 : a.replace(/,/, "").replace(/%/, "").replace(/\$/, "");
        var y = (b == "-") ? 0 : b.replace(/,/, "").replace(/%/, "").replace(/\$/, "");
        x = parseFloat(x);
        y = parseFloat(y);
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    };

    jQuery.fn.dataTableExt.oSort['numeric-comma-desc'] = function (a, b) {
        var x = (a == "-") ? 0 : a.replace(/,/, "").replace(/%/, "").replace(/\$/, "");
        var y = (b == "-") ? 0 : b.replace(/,/, "").replace(/%/, "").replace(/\$/, "");
        x = parseFloat(x);
        y = parseFloat(y);
        return ((x < y) ? 1 : ((x > y) ? -1 : 0));
    };

    ko.bindingHandlers.dataTable = {
        init: function(element, valueAccessor) {
            var binding = ko.utils.unwrapObservable(valueAccessor());

            // If the binding is an object with an options field,
            // initialise the dataTable with those options. 
            if (binding.options) {
                $(element).dataTable(binding.options);
            }
        },
        update: function(element, valueAccessor) {

            var binding = ko.utils.unwrapObservable(valueAccessor());

            // If the binding isn't an object, turn it into one. 
            if (!binding.data) {
                binding = { data: valueAccessor() };
            }
            var oTable = rebuildTable(binding, element);

            $(element).on('draw', subscribeToDetailsClick(oTable));
            
            /* Add event listener for opening and closing details
            * Note that the indicator for showing which row is open is not controlled by DataTables,
            * rather it is done here
            */
            
        }
    };

    function subscribeToDetailsClick(oTable)
    {
        var iTableCounter = 0;
        $('#unbalancedOrderTable tbody td img').bind('click', function () {
            var nTr = $(this).parents('tr')[0];
            if (oTable.fnIsOpen(nTr)) {
                /* This row is already open - close it */
                this.src = "/Content/images/expand.png";
                oTable.fnClose(nTr);
            }
            else {
                //                    /* Open this row */
                this.src = "/Content/images/collapse.png";
                var data = oTable.fnGetData(nTr)[7];
                oTable.fnOpen(nTr, fnFormatDetails(iTableCounter, data), 'details');
                var oInnerTable = $("#detailsTable_" + iTableCounter).dataTable({
                    //                        "bJQueryUI": true,
                    "bPaginate": false,
                    "bFilter": false,
                    "bInfo": false
                });
                iTableCounter = iTableCounter + 1;
            }
        });
    }

    function rebuildTable(binding, element) {

        // Clear table
        $(element).dataTable().fnClearTable();

        // Rebuild table from data source specified in binding
        $(element).dataTable().fnAddData(binding.data());

        var oTable = $(element).dataTable();

        $(element).children("thead").not(".tableFloatingHeader").children("tr.filter").children("td").not(".nonsortable").each(function (i, elem) {
            var className = elem.className, columnData = oTable.fnGetColumnData(i);
            this.innerHTML = fnCreateSelect(columnData, className);
            oTable.fnFilter('', i);
            $('select', this).change(function () {
                var escapedVal = $(this).val().replace(/\+/, "\\+").replace(/\$/, "\\$"), input;
                if (escapedVal == "")
                    input = "";
                else {
                    escapedVal = escapedVal.replace("(Blanks)", "");
                    input = "^" + escapedVal + "$";
                }
                oTable.fnFilter(input, i, true);
            });
        });

        if (binding.initialSort) {
            oTable.fnSort(binding.initialSort);
        }

        oTable.fnFilter('');
        if ($.isFunction(binding.hiddenColumns) && binding.hiddenColumns()) {
            binding.hiddenColumns().each(function (iCol) {
                oTable.fnSetColumnVis(iCol, false);
            });
        }
        return oTable;
    }

    function fnFormatDetails(table_id, html) {
//        var sOut = "<table id=\"exampleTable_" + table_id + "\">";
        var sOut = '<table class="table detailsTable  table-condensed table-hover table-striped table-bordered " id="detailsTable_' + table_id + '">';
        sOut += html;
        sOut += "</table>";
        return sOut;
    }

})(jQuery);