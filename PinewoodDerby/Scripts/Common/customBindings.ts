/// <reference path="../typings/knockout/knockout.d.ts"/>
/// <reference path="../typings/jqueryui/jqueryui.d.ts"/>

ko.bindingHandlers["datePicker"] = {
    init: function (element, valueAccessor, allBindingsAccessor) {
        var options = allBindingsAccessor().datepickerOptions || {};
        $(element).datepicker(options);

        //handle the field changing
        ko.utils.registerEventHandler(element, "change", function () {
            var observable = valueAccessor();
            observable($(element).datepicker("getDate"));
        });

        //handle disposal (if KO removes by the template binding)
        ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
            $(element).datepicker("destroy");
        });
    },

    update: function (element, valueAccessor) {
        var value = ko.utils.unwrapObservable(valueAccessor()),
            current = $(element).datepicker("getDate");

        if (<any>value - <any>current !== 0)
        {
            $(element).datepicker("setDate", value);
        }
    }
};

ko.bindingHandlers["onEnter"] = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var allBindings = allBindingsAccessor();

        $(element).on('keypress', function (e) {
            var keyCode = e.which || e.keyCode;
            if (keyCode !== 13)
            {
                return true;
            }

            var target = e.target;
            $(target).blur();

            allBindings.onEnter.call(viewModel, viewModel, target, element);

            return false;
        });
    }
};

ko.bindingHandlers["onTab"] = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
        var allBindings = allBindingsAccessor();

        $(element).on('keypress', function (e) {
            var keyCode = e.which || e.keyCode;
            if (keyCode !== 9)
            {
                return true;
            }

            var target = e.target;
            $(target).blur();

            allBindings.onTab.call(viewModel, viewModel, target, element);

            return false;
        });
    }
};

//jqAuto -- main binding (should contain additional options to pass to autocomplete)
//jqAutoSource -- the array to populate with choices (needs to be an observableArray)
//jqAutoQuery -- function to return choices
//jqAutoValue -- where to write the selected value
//jqAutoSourceLabel -- the property that should be displayed in the possible choices
//jqAutoSourceInputValue -- the property that should be displayed in the input box
//jqAutoSourceValue -- the property to use for the value
ko.bindingHandlers["jqAuto"] = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel) {
        var options = valueAccessor() || {},
            allBindings = allBindingsAccessor(),
            unwrap = ko.utils.unwrapObservable,
            modelValue = allBindings.jqAutoValue,
            source = allBindings.jqAutoSource,
            query = allBindings.jqAutoQuery,
            maxItems = allBindings.jqAutoMaxItems,
            valueProp = allBindings.jqAutoSourceValue,
            inputValueProp = allBindings.jqAutoSourceInputValue || valueProp,
            labelProp = allBindings.jqAutoSourceLabel || inputValueProp;

        //function that is shared by both select and change event handlers
        function writeValueToModel(valueToWrite) {
            if (ko.isWriteableObservable(modelValue)) {
               modelValue(valueToWrite );  
            } else {  //write to non-observable
               if (allBindings['_ko_property_writers'] && allBindings['_ko_property_writers']['jqAutoValue'])
                        allBindings['_ko_property_writers']['jqAutoValue'](valueToWrite );    
            }
        }
        
        //on a selection write the proper value to the model
        options.select = function(event, ui) {
            writeValueToModel(ui.item ? ui.item.actualValue : null);
        };
            
        //on a change, make sure that it is a valid value or clear out the model value
        options.change = function(event, ui) {
            var currentValue = $(element).val();
            writeValueToModel(currentValue);
            var matchingItem =  ko.utils.arrayFirst(<any>unwrap(source), function(item) {
               return unwrap(inputValueProp ? item[inputValueProp] : item) === currentValue;   
            });
            
//            if (!matchingItem) {
//               writeValueToModel(currentValue);
//            }    
        }
        
        //hold the autocomplete current response
        var currentResponse = null;
            
        //handle the choices being updated in a DO, to decouple value updates from source (options) updates
        var mappedSource = ko.computed({
            read: function() {
                var mapped = ko.utils.arrayMap(<any>unwrap(source), function (item) {
                    var result = {
                    label: labelProp ? unwrap(item[labelProp]) : unwrap(<any>item).toString(),  //show in pop-up choices
                    value: inputValueProp ? unwrap(item[inputValueProp]) : unwrap(<any>item).toString(),  //show in input box
                    actualValue: valueProp ? unwrap(item[valueProp]) : item,  //store in model
                };
                        return result;
                });
                return mapped;                
            },
            write: function(newValue) {
                source(newValue);  //update the source observableArray, so our mapped value (above) is correct
                if (currentResponse) {
                    currentResponse(mappedSource());
                }
            },
            disposeWhenNodeIsRemoved: element
        });
        
        if (query) {
            options.source = function(request, response) {  
                currentResponse = response;
                query.call(this, request.term, mappedSource);
            }
        } else {
            //whenever the items that make up the source are updated, make sure that autocomplete knows it
            mappedSource.subscribe(function(newValue) {
                $(element).autocomplete("option", "source", (request, response) => response((<any>$.ui.autocomplete).filter(newValue, request.term).slice(0, maxItems ? maxItems : newValue.length - 1))); 
            });

            var result = mappedSource();
            options.source = (request, response) => response((<any>$.ui.autocomplete).filter(result, request.term).slice(0, maxItems ? maxItems : result.length - 1));


//            $("#auto").autocomplete({
//                source: function(request, response) {
//                    var results = $.ui.autocomplete.filter(myarray, request.term);
//
//                    response(results.slice(0, 10));
//                }
//            }
        }
        
        
        //initialize autocomplete
        $(element).autocomplete(options);
    },
    update: function(element, valueAccessor, allBindingsAccessor, viewModel) {
       //update value based on a model change
       var allBindings = allBindingsAccessor(),
           unwrap = ko.utils.unwrapObservable,
           modelValue: any = unwrap(allBindings.jqAutoValue) || '', 
           valueProp = allBindings.jqAutoSourceValue,
           inputValueProp = allBindings.jqAutoSourceInputValue || valueProp;
        
       //if we are writing a different property to the input than we are writing to the model, then locate the object
       if (valueProp && inputValueProp !== valueProp) {
           var source = unwrap(allBindings.jqAutoSource) || [];
           modelValue = ko.utils.arrayFirst(<any>source, <any>function(item) {
                 return unwrap(item[valueProp]) === modelValue;
           }) || {};             
       } 

       //update the element with the value that should be shown in the input
       $(element).val(modelValue && inputValueProp !== valueProp ? <any>unwrap(modelValue[inputValueProp]) : modelValue.toString());    
    }
};

ko.bindingHandlers["returnAction"] = {
    init: function (element, valueAccessor, allBindingsAccessor, viewModel) {

        var value = <any>ko.utils.unwrapObservable(valueAccessor());

        $(element).keydown(function (e) {
            if (e.which === 13) {
                value(viewModel);
            }
        });
    }
};