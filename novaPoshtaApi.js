(function (window, undefined) {
    'use strict';

    let settings = {};

    let npApi = {
        init(options){
            for (let p in options) {
                if (options.hasOwnProperty(p)) {
                    settings[p] = options[p];
                }
            }

            if (settings.language == 'UA') {
                settings.language = 'Description';
            } else if (settings.language == 'RU') {
                settings.language = 'DescriptionRu';
            }
            prepareLocalStorage();
            autocompleteInit();
        }
    };

    /*                                  Local storage prepare
     ****************************************************************************************************
     */

    let citiesCatalog = {};
    let warehouses = {};
    let warehousesForCurrentCity = []; // warehouses array for the current checked city


    function prepareLocalStorage() {
        if (isLastUpdateToday() && localStorage.getItem('citiesCatalog') !== null && localStorage.getItem('warehouses') !== null) {
            console.log('Use old catalogs');
            citiesCatalog = JSON.parse(localStorage.getItem('citiesCatalog'));
            warehouses = JSON.parse(localStorage.getItem('warehouses'));
        } else {
            console.log('Preparing new catalogs');
            localStorage.setItem('catalogLastUpdate', new Date());
            putCitiesCatalogToLocalStorage();
            putWarehousesToLocalStorage();
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

    function putCitiesCatalogToLocalStorage() {
        citiesCatalog = getCitiesCatalog();
        let l = citiesCatalog.length;
        // delete unnecessary properties form citiesCatalog to decrease its size
        for (let i = 0; i < l; i++) {
            for (let property in citiesCatalog[i]) {
                if (citiesCatalog[i].hasOwnProperty(property)) {
                    if (property != settings.language && property != 'Ref') {
                        delete citiesCatalog[i][property];
                    }
                }
                citiesCatalog[i].value = citiesCatalog[i][settings.language];
                citiesCatalog[i].label = citiesCatalog[i][settings.language];
            }
        }
        localStorage.setItem('citiesCatalog', JSON.stringify(citiesCatalog));
    }

    function putWarehousesToLocalStorage() {
        warehouses = getWarehousesCatalog();
        let l = warehouses.length;
        // delete unnecessary properties form warehouses to decrease its size
        for (let i = 0; i < l; i++) {
            for (let property in warehouses[i]) {
                if (warehouses[i].hasOwnProperty(property)) {
                    if (property != settings.language && property != 'Ref' && property != 'CityRef') {
                        delete warehouses[i][property];
                    }
                }
                warehouses[i].value = warehouses[i][settings.language];
                warehouses[i].label = warehouses[i][settings.language];
            }
        }
        localStorage.setItem('warehouses', JSON.stringify(warehouses));
    }

    function getCitiesCatalog() {
        let result = {};
        $.ajax({
            type: "POST",
            async: false,
            contentType: "application/json; charset=utf-8",
            url: settings.citiesApiUrl,
            data: JSON.stringify({
                "modelName": "Address",
                "calledMethod": "getCities",
                "apiKey": settings.apiKey
            }),
            success: function (response) {
                let l = response.data.length;
                for (let i = 0; i < l; i++) {
                    response.data[i].value = response.data[i][settings.language];
                    response.data[i].label = response.data[i][settings.language];
                }
                result = response.data;
            }
        });
        return result;
    }


    function getWarehousesCatalog() {
        let result = {};
        $.ajax({
            type: "POST",
            async: false,
            contentType: "application/json; charset=utf-8",
            url: settings.warehousesApiUrl,
            data: JSON.stringify({
                "modelName": "AddressGeneral",
                "calledMethod": "getWarehouses",
                "apiKey": settings.apiKey
            }),
            success: function (response) {
                let l = response.data.length;
                for (let i = 0; i < l; i++) {
                    response.data[i].value = response.data[i][settings.language];
                    response.data[i].label = response.data[i][settings.language];
                }
                result = response.data;
            }
        });
        return result;
    }

    /*                                  Find match for autocomplete
     ****************************************************************************************************
     */

    function getMatchedCities(citiesCatalog, term) {
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
            let fragment = citiesCatalog[i][settings.language].split('(')[0];
            if (fragment.indexOf(term) !== -1) {
                result.push({
                    value: citiesCatalog[i][settings.language],
                    label: citiesCatalog[i][settings.language],
                    ref: citiesCatalog[i].Ref
                });
            }
        }
        return result;
    }


    function getMatchedWarehouse(warehouses, term) {
        let result = [];
        let l = warehouses.length;
        for (let i = 0; i < l; i++) {
            if (warehouses[i][settings.language].indexOf(term) !== -1) {
                result.push({
                    value: warehouses[i][settings.language],
                    label: warehouses[i][settings.language],
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

    function autocompleteInit() {
        // autocomplete for city choose
        settings.cityInput.autocomplete({
            source: function (request, response) {
                response(getMatchedCities(citiesCatalog, request.term));
            },
            select: function (event, ui) {
                $(this).val(ui.item.label);
                settings.cityRef.val(ui.item.ref);
                warehousesForCurrentCity = getWarehousesForCurrentCity(warehouses, ui.item.ref);
                settings.warehouseInput.val('');
                settings.warehouseRef.val('');
                return false;
            }
        });


        // autocomplete for choose warehouse
        settings.warehouseInput.autocomplete({
            source: function (request, response) {
                response(getMatchedWarehouse(warehousesForCurrentCity, request.term));
            },
            select: function (event, ui) {
                $(this).val(ui.item.label);
                settings.warehouseRef.val(ui.item.ref);
                return false;
            }
        });
    }

    window.npApi = npApi;

})(window);