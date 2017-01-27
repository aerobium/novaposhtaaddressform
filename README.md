# Cities and warehouses search for Nova Poshta API

Backend-free and almost _offline_ widget for search cities and warehouses via Nova Poshta API.
First of all this solution is designed for the CRM.

## Advantages:
* backend-free (no requests to your backend), 
* low traffic: only one request to the Nova Poshta APU per day.

## How does it work?
Once a day catalog will be updated and stored into your browser localstorage.

## Usage

* Add reference to Jquery and Jquery-ui (js and css) to your html.
* Add reference to novaPoshtaApi.js
* Add some inputs to your html (see [example](https://github.com/aerobium/novaposhtaaddressform/blob/master/example.html))
* Put this code below

```js
    npApi.init({
        citiesApiUrl    :   'http://api.novaposhta.ua/v2.0/json/Address/getCities',
        warehousesApiUrl:   'http://api.novaposhta.ua/v2.0/json/AddressGeneral/getWarehouses',
        apiKey          :   'YOUR_NOVA_POSHTA_PRIVATE_KEY_FOR_API',
        cityInput       :   $('input[name="city"]'),  // input with city,
        warehouseInput  :   $('input[name="warehouse"]'), // input with warehouse,
        cityRef         :   $('input[name="cityRef"]'), // input with city reference,
        warehouseRef    :   $('input[name="warehouseRef"]') // input with warehouse reference,
    });
```

_Note:_ all options are mandatory in this version.