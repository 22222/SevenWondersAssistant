(function () {
    var isInitialized = function (element, widgetName) {
        return typeof $.data(element, widgetName) !== 'undefined';
    };

    var refreshJqmWidget = function (element, widgetName) {
        if (isInitialized(element, widgetName)) {
            $(element)[widgetName]('refresh');
        }
    };

    ko.bindingHandlers.jqmChecked = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            if (ko.bindingHandlers.checked.init) {
                ko.bindingHandlers.checked.init.apply(this, arguments);
            }
        },
        update: function (element, valueAccessor) {
            if (ko.bindingHandlers.checked.update) {
                ko.bindingHandlers.checked.update.apply(this, arguments);
            } else {
                var value = ko.unwrap(valueAccessor());
                if (element.type == "checkbox") {
                    if (value instanceof Array) {
                        element.checked = ko.utils.arrayIndexOf(value, element.value) >= 0;
                    } else {
                        element.checked = value;
                    }
                } else if (element.type == "radio") {
                    element.checked = (element.value == value);
                }
            }
            refreshJqmWidget(element, 'checkboxradio');
        }
    };

    ko.bindingHandlers.jqmSliderValue = {
        init: function (element, valueAccessor, allBindingsAccessor) {
            ko.bindingHandlers.value.init.apply(this, arguments);
        },
        update: function (element, valueAccessor) {
            ko.bindingHandlers.value.update.apply(this, arguments);
            refreshJqmWidget(element, 'slider');
        }
    };

    // http://stackoverflow.com/questions/7246732/automatically-refresh-list-view-on-change-knockoutjs-jquery-mobile
    ko.bindingHandlers.jqmRefreshListview = {
        update: function (element, valueAccessor) {
            //just to create a dependency
            ko.utils.unwrapObservable(valueAccessor());

            // Need the setTimeout because if the foreach is on a virtual root 
            // (those comment thingers) then this would be called before the 
            // list is actually updated.
            setTimeout(function () {
                refreshJqmWidget(element, 'listview');
            });
        }
    };

    ko.bindingHandlers.jqmRefreshButton = {
        update: function (element, valueAccessor) {
            //just to create a dependency
            ko.utils.unwrapObservable(valueAccessor());

            var $el = $(element);
            if (!$el.hasClass("ui-btn")) {
                $el.buttonMarkup();
            }
        }
    };
} ());