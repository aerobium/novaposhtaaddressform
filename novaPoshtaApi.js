(function (window) {
    'use strict';

    function AutoCompleteUnit(options) {

        for (let p in options) {
            if (options.hasOwnProperty(p)) {
                this[p] = options[p];
            }
        }

        if (options.language == 'UA') {
            this.language = 'Description';
        } else if (options.language == 'RU') {
            this.language = 'DescriptionRu';
        }
    }

    let npApi = {
        init(option){
            let autoCompleteUnit = new AutoCompleteUnit(option);
            prepareLocalStorage(autoCompleteUnit);
            autocompleteInit(autoCompleteUnit);
        }
    };

    /*                                  Local storage prepare
     ****************************************************************************************************
     */

    let citiesCatalog = {};
    let warehouses = {};


    function prepareLocalStorage(autoCompleteUnit) {
        if (isLastUpdateToday() && localStorage.getItem('citiesCatalog') !== null && localStorage.getItem('warehouses') !== null) {
            console.log('Use old catalogs');
            citiesCatalog = JSON.parse(localStorage.getItem('citiesCatalog'));
            warehouses = JSON.parse(localStorage.getItem('warehouses'));
        } else {
            console.log('Preparing new catalogs');
            localStorage.setItem('catalogLastUpdate', new Date());
            putCitiesCatalogToLocalStorage(autoCompleteUnit);
            putWarehousesToLocalStorage(autoCompleteUnit);
        }
    }


    /**
     * Check if localStorage was last time updated today or not.
     */
    function isLastUpdateToday() {
        if (localStorage.getItem('catalogLastUpdate') === null) {
            return false;
        } else if (new Date().getDate() !== new Date(localStorage.getItem('catalogLastUpdate')).getDate()) {
            return false;
        }
        return true;
    }

    function putCitiesCatalogToLocalStorage(autoCompleteUnit) {
        citiesCatalog = getCitiesCatalog(autoCompleteUnit);
        let l = citiesCatalog.length;
        // delete unnecessary properties form citiesCatalog to decrease its size
        for (let i = 0; i < l; i++) {
            for (let property in citiesCatalog[i]) {
                if (citiesCatalog[i].hasOwnProperty(property)) {
                    if (property != autoCompleteUnit.language && property != 'Ref') {
                        delete citiesCatalog[i][property];
                    }
                }
                citiesCatalog[i].value = citiesCatalog[i][autoCompleteUnit.language];
                citiesCatalog[i].label = citiesCatalog[i][autoCompleteUnit.language];
            }
        }
        localStorage.setItem('citiesCatalog', JSON.stringify(citiesCatalog));
    }

    function putWarehousesToLocalStorage(autoCompleteUnit) {
        warehouses = getWarehousesCatalog(autoCompleteUnit);
        let l = warehouses.length;
        // delete unnecessary properties form warehouses to decrease its size
        for (let i = 0; i < l; i++) {
            for (let property in warehouses[i]) {
                if (warehouses[i].hasOwnProperty(property)) {
                    if (property != autoCompleteUnit.language && property != 'Ref' && property != 'CityRef') {
                        delete warehouses[i][property];
                    }
                }
                warehouses[i].value = warehouses[i][autoCompleteUnit.language];
                warehouses[i].label = warehouses[i][autoCompleteUnit.language];
            }
        }
        localStorage.setItem('warehouses', JSON.stringify(warehouses));
    }

    function getCitiesCatalog(autoCompleteUnit) {
        let result = {};
        $.ajax({
            type: "POST",
            async: false,
            contentType: "application/json; charset=utf-8",
            url: autoCompleteUnit.citiesApiUrl,
            data: JSON.stringify({
                "modelName": "Address",
                "calledMethod": "getCities",
                "apiKey": autoCompleteUnit.apiKey
            }),
            success: function (response) {
                let l = response.data.length;
                for (let i = 0; i < l; i++) {
                    response.data[i].value = response.data[i][autoCompleteUnit.language];
                    response.data[i].label = response.data[i][autoCompleteUnit.language];
                }
                result = response.data;
            }
        });
        return result;
    }


    function getWarehousesCatalog(autoCompleteUnit) {
        let result = {};
        $.ajax({
            type: "POST",
            async: false,
            contentType: "application/json; charset=utf-8",
            url: autoCompleteUnit.warehousesApiUrl,
            data: JSON.stringify({
                "modelName": "AddressGeneral",
                "calledMethod": "getWarehouses",
                "apiKey": autoCompleteUnit.apiKey
            }),
            success: function (response) {
                let l = response.data.length;
                for (let i = 0; i < l; i++) {
                    response.data[i].value = response.data[i][autoCompleteUnit.language];
                    response.data[i].label = response.data[i][autoCompleteUnit.language];
                }
                result = response.data;
            }
        });
        return result;
    }

    /*                                  Find match for autocomplete
     ****************************************************************************************************
     */

    function getMatchedCities(citiesCatalog, term, autoCompleteUnit) {
        let result = [];

        // search should work even if start typing in lowercase
        term = term.charAt(0).toUpperCase() + term.slice(1);

        let l = citiesCatalog.length;
        for (let i = 0; i < l; i++) {
            /*
             * Some 'Description' contains region name in the '()', i.g. Description : 'x (y)'
             * where x - city name, y - region name. We mast search only through the cities name. Because of this we
             * take part of 'Description' before first '(' entry.
             */
            let fragment = citiesCatalog[i][autoCompleteUnit.language].split('(')[0];
            if (fragment.indexOf(term) !== -1) {
                result.push({
                    value: citiesCatalog[i][autoCompleteUnit.language],
                    label: citiesCatalog[i][autoCompleteUnit.language],
                    ref: citiesCatalog[i].Ref
                });
            }
        }
        return result;
    }


    function getMatchedWarehouse(warehouses, term, autoCompleteUnit) {
        let result = [];
        let l = warehouses.length;
        for (let i = 0; i < l; i++) {
            if (warehouses[i][autoCompleteUnit.language].indexOf(term) !== -1) {
                result.push({
                    value: warehouses[i][autoCompleteUnit.language],
                    label: warehouses[i][autoCompleteUnit.language],
                    ref: warehouses[i].Ref
                });
            }
        }
        return result;
    }


    function getWarehousesForCurrentCity(warehouses, cityRef) {
        let result = [];
        let l = warehouses.length;
        for (let i = 0; i < l; i++) {
            if (warehouses[i].CityRef == cityRef) {
                result.push(warehouses[i]);
            }
        }
        return result;
    }


    /*                                  Autocomplete initialize
     ****************************************************************************************************
     */

    function autocompleteInit(autoCompleteUnit) {
        // autocomplete for city choose
        autoCompleteUnit.cityInput.autocomplete({
            source: function (request, response) {
                response(getMatchedCities(citiesCatalog, request.term, autoCompleteUnit));
            },
            select: function (event, ui) {
                $(this).val(ui.item.label);
                autoCompleteUnit.cityRef.val(ui.item.ref);
                autoCompleteUnit.warehousesForCurrentCity = getWarehousesForCurrentCity(warehouses, ui.item.ref);
                autoCompleteUnit.warehouseInput.val('');
                autoCompleteUnit.warehouseRef.val('');
                return false;
            }
        });


        // autocomplete for choose warehouse
        autoCompleteUnit.warehouseInput.autocomplete({
            source: function (request, response) {
                response(getMatchedWarehouse(autoCompleteUnit.warehousesForCurrentCity, request.term, autoCompleteUnit));
            },
            select: function (event, ui) {
                $(this).val(ui.item.label);
                autoCompleteUnit.warehouseRef.val(ui.item.ref);
                return false;
            }
        });
    }

    window.npApi = npApi;
})(window);