(function (window, undefined) {
    'use strict';

    let citiesApiUrl =      'http://api.novaposhta.ua/v2.0/json/Address/getCities';
    let warehousesApiUrl =  'http://api.novaposhta.ua/v2.0/json/AddressGeneral/getWarehouses';
    let apiKey =            'YOUR_NOVA_POSHTA_PRIVATE_KEY_FOR_API';
    let cityInput =         $('input[name="city"]');  // input with city
    let warehouseInput =    $('input[name="warehouse"]'); // input with warehouse
    let cityRef =           $('input[name="cityRef"]');
    let warehouseRef =      $('input[name="warehouseRef"]');


    /*                                  Local storage prepare
     ****************************************************************************************************
     */

    let citiesCatalog;
    let warehouses;

    // FixMe it must be cleared usually
    let warehousesForCurrentCity = []; // warehouses array for the current checked city

    if (localStorage.getItem('citiesCatalog') != null) {
        citiesCatalog = JSON.parse(localStorage.getItem('citiesCatalog'));
    } else {
        citiesCatalog = getCitiesCatalog();

        // delete unnecessary properties form citiesCatalog (local storage has limit size)
        for (let i = 0; i < citiesCatalog.length; i++) {
            for (let property in citiesCatalog[i]) {
                if (citiesCatalog[i].hasOwnProperty(property)) {
                    if (property != 'DescriptionRu' && property != 'Ref') {
                        delete citiesCatalog[i][property]
                    }
                }
                citiesCatalog[i].value = citiesCatalog[i].DescriptionRu;
                citiesCatalog[i].label = citiesCatalog[i].DescriptionRu;
            }
        }
        localStorage.setItem('citiesCatalog', JSON.stringify(citiesCatalog));
    }


    if (localStorage.getItem('warehouses') != null) {
        warehouses = JSON.parse(localStorage.getItem('warehouses'));
    } else {
        warehouses = getWarehousesCatalog();

        // delete unnecessary properties form warehouses (local storage has limit size)
        for (let i = 0; i < warehouses.length; i++) {
            for (let property in warehouses[i]) {
                if (warehouses[i].hasOwnProperty(property)) {
                    if (property != 'DescriptionRu' && property != 'Ref' && property != 'CityRef') {
                        delete warehouses[i][property]
                    }
                }
                warehouses[i].value = warehouses[i].DescriptionRu;
                warehouses[i].label = warehouses[i].DescriptionRu;
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
            url: citiesApiUrl,
            data: JSON.stringify({
                "modelName": "Address",
                "calledMethod": "getCities",
                "apiKey": apiKey
            }),
            success: function (response) {
                for (let i = 0; i < response.data.length; i++) {
                    response.data[i].value = response.data[i].DescriptionRu;
                    response.data[i].label = response.data[i].DescriptionRu;
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
            url: warehousesApiUrl,
            data: JSON.stringify({
                "modelName": "AddressGeneral",
                "calledMethod": "getWarehouses",
                "apiKey": apiKey
            }),
            success: function (response) {
                for (let i = 0; i < response.data.length; i++) {
                    response.data[i].value = response.data[i].DescriptionRu;
                    response.data[i].label = response.data[i].DescriptionRu;
                }
                result = response.data;
            }
        });
        return result;
    }


    /*                                  Regexp matcher for autocomplete
     ****************************************************************************************************
     */

    function getMatchedCities(citiesCatalog, term) {
        let result = [];
        let length = citiesCatalog.length;

        term = term.charAt(0).toUpperCase() + term.slice(1);

        for (let i = 0; i < length; i++) {
            /*
             * Some 'DescriptionRu' contains region name in the '()', i.g. DescriptionRu : 'x (y)'
             * where x - city name, y - region name. We mast search only through the cities name. Because of this we
             * take part of 'DescriptionRu' before first '(' entry.
             */
            let fragment = citiesCatalog[i].DescriptionRu.split('(')[0];
            if (fragment.indexOf(term) !== -1) {
                result.push({
                    value: citiesCatalog[i].DescriptionRu,
                    label: citiesCatalog[i].DescriptionRu,
                    ref: citiesCatalog[i].Ref
                })
            }
        }
        return result;
    }

    function getMatchedWarehouse(warehouses, term) {
        let result = [];
        let length = warehouses.length;
        for (let i = 0; i < length; i++) {


            // ToDo need feedback from users to understand if they need this feature
            // /*
            //  * Most of the 'DescriptionRu' in the 'warehouses' contains delimitation ':' after warehouse number,
            //  * i.g. x : y
            //  * where x - warehouse number, y - address info. We mast search only through the warehouse numbers.
            //  * Because of this we take part of 'DescriptionRu' before first ':' entry.
            //  */
            // let fragment = warehouses[i].DescriptionRu.split(':')[0];

            if (warehouses[i].DescriptionRu.indexOf(term) !== -1) {
                result.push({
                    value: warehouses[i].DescriptionRu,
                    label: warehouses[i].DescriptionRu,
                    ref: warehouses[i].Ref
                })
            }

        }
        return result;
    }

    function getWarehousesForCurrentCity(warehouses, cityRef) {
        let result = [];
        let size = warehouses.length;
        for (let i = 0; i < size; i++) {
            if (warehouses[i].CityRef == cityRef) {
                result.push(warehouses[i])
            }
        }
        return result;
    }


    /*                                  Autocomplete initialize
     ****************************************************************************************************
     */

    // autocomplete for city choose
    cityInput.autocomplete({
        source: function (request, response) {
            response(getMatchedCities(citiesCatalog, request.term))
        },
        select: function (event, ui) {
            $(this).val(ui.item.label);
            cityRef.val(ui.item.ref);
            warehousesForCurrentCity = getWarehousesForCurrentCity(warehouses, ui.item.ref);
            warehouseInput.val('');
            warehouseRef.val('');
            return false;
        }
    });

    // FixMe this must work if city was chosen
    // autocomplete for choose warehouse
    warehouseInput.autocomplete({
        source: function (request, response) {
            response(getMatchedWarehouse(warehousesForCurrentCity, request.term))
        },
        select: function (event, ui) {
            $(this).val(ui.item.label);
            warehouseRef.val(ui.item.ref);
            return false;
        }
    });

    $('.city-fast-pick div').on('click', function () {
        let thisCityRef = $(this).attr('data-cityRef');
        cityInput.val($(this).text());
        cityRef.val(thisCityRef);
        warehousesForCurrentCity = getWarehousesForCurrentCity(warehouses, thisCityRef);
        warehouseInput.val(''); // clear warehouse input from old values
        warehouseRef.val(''); // clear warehouse input from old values
    })

})(window);
