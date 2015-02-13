//// <reference path="../typings/knockout/knockout.d.ts"/> 
/// <reference path="../typings/moment/moment.d.ts"/>
/// <reference path="../typings/sugar/sugar.d.ts"/>
/// <reference path="../typings/jquery/jquery.d.ts"/>

export class DataTableHelper {
    public FnCaseInsensitiveCompare(a, b, isNumericColumn) {
        var al = this.FormatForSorting(a, isNumericColumn), bl = this.FormatForSorting(b, isNumericColumn);
        return al == bl ? (a == b ? 0 : a < b ? -1 : 1) : al < bl ? -1 : 1;
    }

    public FnCreateSelect(aData, selectedValue, isNumericColumn) {
        return '<select>' +
            this.CreateSelectOptions(aData, selectedValue, isNumericColumn) +
            '</select>';
    }

    public CreateSelectOption(val, selectedValue) {
        var selectedStr;
        if (val === '' || val.toLowerCase() == "null") {
            val = '(Blanks)';
        }
        if (selectedValue == val) {
            selectedStr = ' selected="selected"';
        } else {
            selectedStr = '';
        }
        return '<option value="' + val + '"' + selectedStr + '>' + val + '</option>';
    }

    public FormatForSorting(val, isNumeric) {
        if (isNumeric && !isNaN(+val)) {
            return parseFloat(val).toFixed(2);
        }
        return val.toLowerCase();
    }

    public CreateSelectOptions(aData, selectedValue, isNumericColumn) {
        var sortedData = aData.sort((a, b) => this.FnCaseInsensitiveCompare(a, b, isNumericColumn)),
            val,
            r = '<option value=""></option>',
            i,
            iLen = aData.length;
        for (i = 0; i < iLen; i++) {
            val = sortedData[i];
            r += this.CreateSelectOption(val, selectedValue);
        }
        if (iLen === 0 && selectedValue) {
            r += this.CreateSelectOption(selectedValue, selectedValue);
        }
        return r;
    }

    public AddDefaultColumnValueDefs(options, numColumns) {
        var i,
            defaultValues = [];
        for (i = 0; i < numColumns; i++) {
            defaultValues.push({ sDefaultContent: "" });
        }
        options.aoColumns = defaultValues;
    }

    public GetCommonDataTableOptions(table, numColumns) {
        var boolCols = [],
            nonSortedCols = [],
            readOnlyCols = [],
            allCols = $('tr th', table),
            options;
        allCols.each(function(index) {
            if ($(this).filter('.bool').length > 0) {
                boolCols.push(index);
            }
            if ($(this).filter('.nonsortable').length > 0) {
                nonSortedCols.push(index);
            }
            if ($(this).filter('.read_only').length > 0) {
                readOnlyCols.push(index);
            }
        });

        options = {
            bPaginate: true,
            //sDom: "<'row-fluid'<'span6'l><'span6'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
            sDom: "<'row-fluid'<'span4'l><'span4'<'new_controls'>><'span4'f>r>t<'row-fluid'<'span6'i><'span6'p>>",
            sPaginationType: "full_numbers",
            bFilter: true,
            bSortCellsTop: true,
            oLanguage: {
                sSearch: "Search all columns",
                sLengthMenu: "show _MENU_ entries"
            },
            iDisplayLength: 25,
            aLengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
            aoColumnDefs: [
                {
                    bUseRendered: false,
                    "fnRender": obj => {
                        if (obj.aData[obj.iDataColumn] == 'true') {
                            return '<i class="icon-check"></i>';
                        } else {
                            return '';
                        }
                    },
                    "aTargets": boolCols
                },
                {
                    bSearchable: false,
                    aTargets: nonSortedCols
                },
                {
                    bSortable: false,
                    aTargets: nonSortedCols
                },
                {
                    sClass: "read_only",
                    aTargets: readOnlyCols
                }
            ]
        };
        if (typeof numColumns !== "undefined") {
            this.AddDefaultColumnValueDefs(options, numColumns);
        }
        return options;
    }

    public CreateServerSideTable(className, ajaxSource, fnServerParams, afterLoadCallback) {
        var dataTable,
            options;

        $(className).each((i, table) => {
            var numColumns = $('tr th', table).size();
            options = this.GetCommonDataTableOptions(table, numColumns);
            options.bProcessing = true;
            options.bServerSide = true;
            options.sAjaxSource = ajaxSource;
            options.fnServerParams = aoData => {
                    fnServerParams(aoData);
                },
                options.fnServerData = (sSource, aoData, fnCallback) => {
                    $.getJSON(sSource, aoData, json => {
                        var parsedJson = $.parseJSON(json);
                        this.CreateAndPopulateSelectFromJson(dataTable, parsedJson);
                        /* DataTables callback */
                        fnCallback(parsedJson);
                        if (typeof afterLoadCallback !== "undefined") {
                            afterLoadCallback(className);
                        }
                    });
                };
            dataTable = $(table).dataTable(options);
        });
        return dataTable;
    }

    public CreateAndPopulateSelectFromJson(table, json) {
        $("thead tr.filter td", table).not('.nonsortable').each((i, elem: HTMLElement) => {
            var useRegExFiltering = true,
                enableSmartFiltering = false,
                selectableValues = json.select[i],
                selectedValue = json.filters[i];
            if (selectableValues !== undefined) {
                elem.innerHTML = this.FnCreateSelect(selectableValues, selectedValue, elem.className.indexOf("numeric-comma") > -1);
            }
            $('select', elem).change(function() {
                var searchRegex = $(this).val();
                // see http://datatables.net/api#fnFilter for documentation
                table.fnFilter(searchRegex, i, useRegExFiltering, enableSmartFiltering);
            });
        });
    }

}