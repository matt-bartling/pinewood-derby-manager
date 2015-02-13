(function ($) {
    /*
    * Function: fnGetColumnData
    * Purpose: Return an array of table values from a particular column.
    * Returns: array string: 1d data array
    * Inputs: object:oSettings - dataTable settings object. This is always the last argument passed to the function
    * int:iColumn - the id of the column to extract the data from
    * bool:bUnique - optional - if set to false duplicated values are not filtered out
    * bool:bFiltered - optional - if set to false all the table data is used (not only the filtered)
    * bool:bIgnoreEmpty - optional - if set to false empty values are not filtered from the result array
    * Author: Benedikt Forchhammer <b.forchhammer /AT\ mind2.de>
    */
    $.fn.dataTableExt.oApi.fnGetColumnData = function (oSettings, iColumn, bUnique, bFiltered) {
        // check that we have a column id
        if (typeof iColumn == "undefined") return [];

        // by default we only wany unique data
        if (typeof bUnique == "undefined") bUnique = true;

        // by default we do want to only look at filtered data
        if (typeof bFiltered == "undefined") bFiltered = true;


        // list of rows which we're going to loop through
        var aiRows;

        // use only filtered rows
        if (bFiltered) aiRows = oSettings.aiDisplay;
            // use all rowsAccess
        else aiRows = oSettings.aiDisplayMaster; // all row numbers

        // set up data array
        var asResultData = [];

        for (var i = 0, c = aiRows.length; i < c; i++) {
            var iRow = aiRows[i];
            var aData = this.fnGetData(iRow);
            var sValue = aData[iColumn];

            // ignore unique values?
            if (bUnique && jQuery.inArray(sValue, asResultData) > -1) continue;

                // else push the value onto the result data array
            else asResultData.push(sValue);
        }

        return asResultData;
    };
    
    $.fn.dataTableExt.oApi.fnReloadAjax = function (oSettings, sNewSource, args, fnCallback, bStandingRedraw) {
        if (sNewSource !== undefined && sNewSource !== null) {
            oSettings.sAjaxSource = sNewSource;
        }

        // Server-side processing should just call fnDraw
        if (oSettings.oFeatures.bServerSide) {
            this.fnDraw();
            return;
        }

        this.oApi._fnProcessingDisplay(oSettings, true);
        var that = this;
        var iStart = oSettings._iDisplayStart;
        var aData = [];

        this.oApi._fnServerParams(oSettings, aData);
        aData.push({ "queryParams": args });

        oSettings.fnServerData.call(oSettings.oInstance, oSettings.sAjaxSource, aData, function (json) {
            /* Clear the old information from the table */
            that.oApi._fnClearTable(oSettings);

            /* Got the data - add it to the table */
            aData = (oSettings.sAjaxDataProp !== "") ?
                that.oApi._fnGetObjectDataFn(oSettings.sAjaxDataProp)(json) : json;

            for (var i = 0 ; i < aData.length ; i++) {
                that.oApi._fnAddData(oSettings, aData[i]);
            }

            oSettings.aiDisplay = oSettings.aiDisplayMaster.slice();

            that.fnDraw();

            if (bStandingRedraw === true) {
                oSettings._iDisplayStart = iStart;
                that.oApi._fnCalculateEnd(oSettings);
                that.fnDraw(false);
            }

            that.oApi._fnProcessingDisplay(oSettings, false);

            /* Callback user function - for event handlers etc */
            if (typeof fnCallback == 'function' && fnCallback !== null) {
                fnCallback(oSettings);
            }
        }, oSettings);
    };

}(jQuery));