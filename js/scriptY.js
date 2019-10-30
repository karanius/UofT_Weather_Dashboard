"use strict";

$('#clicky').on('click', function (e) {
  e.preventDefault();
  $('#x').text('W: ' + $(window).width() + ' H: ' + $(window).height() + ' Browser: ' + JSON.stringify($.browser));
});
$(window).on('click', function (e) {
  $(e.target).css({
    'filter': 'invert(' + 1 + ')'
  });
  setTimeout(function () {
    $(e.target).css({
      'filter': 'invert(' + 0 + ')'
    });
  }, 600);
});
var model = {
  data: {
    currentCity: ''
  },
  init: async function init() {
    var time = new Date();
    this.today = time.getDate() + '/' + time.getMonth() + '/' + time.getFullYear();
    var goodData = [];

    if (localStorage.searchHistory) {
      // if there is data in local storage, make sure its up-to-date
      var history = await this.history('get');

      for (city in history) {
        if (history[city].date === this.today) {
          goodData.push(true);
        } else {
          goodData.push(false);
        }
      }

      if (goodData.includes(false)) {
        //if not up-to-date, then update it
        await this.history('delete');
        await this.call('toronto');
      } else {
        return '!'; // if its up-to-date, then dont need to do anything
      }
    } else {
      await this.call('toronto'); //else, if there is no data, call for it using ajax, and then build local storage data
    }
  },
  call: async function call(city) {
    city = city.toLowerCase();

    if (city.includes(' ')) {
      city.replace(' ', '+');
    }

    try {
      // grab data, save data, then update current city
      var apiKey = '9710213fc0f3cccc6f013963f9a76866';
      var urlCity = "https://api.openweathermap.org/data/2.5/weather?q=".concat(city, "&units=metric&APPID=").concat(apiKey);
      var fiveDay = "https://api.openweathermap.org/data/2.5/forecast?q=".concat(city, "&units=metric&APPID=").concat(apiKey);
      var cityData = await fetch(urlCity);
      cityData = await cityData.json(); //!!!!!!!!!!!!!!! this is the searched city data

      var urlUV = "https://api.openweathermap.org/data/2.5/uvi/forecast?appid=".concat(apiKey, "&lat=").concat(cityData.coord.lat, "&lon=").concat(cityData.coord.lon, "&cnt=1");
      var uvData = await fetch(urlUV);
      uvData = await uvData.json();
      uvData = uvData[0]; // !!!!!!!!!!!!! this is the uv index for the current city

      var fiveDayData = await fetch(fiveDay);
      fiveDayData = await fiveDayData.json(); // below is the 5 day data

      fiveDayData = [[fiveDayData.list[0]], [fiveDayData.list[8]], [fiveDayData.list[16]], [fiveDayData.list[24]], [fiveDayData.list[32]]];
      await this.upddateCurrentCity(cityData), await this.updateLocalStorage(cityData, uvData, fiveDayData);
    } catch (err) {
      return ['404 Error - City Not Found - Please Check The City Name Which Was Entered', false];
    }
  },
  upddateCurrentCity: async function upddateCurrentCity(city) {
    model.data.currentCity = city.name;
  },
  updateLocalStorage: async function updateLocalStorage(cityData, uvData, fiveDayData) {
    var d = new Date();
    var dataObj = {
      //construct the new data set for the newly searched city
      name: cityData.name,
      date: d.getDate() + '/' + d.getMonth() + '/' + d.getFullYear(),
      dataCity: cityData,
      dataUV: uvData,
      dataFiveDay: fiveDayData
    };

    if (!localStorage.searchHistory) {
      // create search history if non existant
      await this.history('set', [dataObj]);
    } else {
      //else, just add and update it
      await this.history('update', dataObj);
    }
  },
  get: async function get(x) {
    if (x === 'history' && localStorage.searchHistory) {
      return await this.history('get');
    } else if (x === 'current') {
      return await model.data.currentCity;
    } else {
      var history = await this.history('get');

      for (i in history) {
        if (history[i].name.toLowerCase() === x.toLowerCase()) {
          return history[i];
        }
      }
    }
  },
  findCityData: async function findCityData(city) {
    if (await this.isInSearchHistory(city)) {
      //if city is alredy in history, send it back to be rendered
      var data = await this.get(city);
      return [data, true];
    } else {
      var _data = await this.call(city);

      return _data;
    }
  },
  isInSearchHistory: async function isInSearchHistory(city) {
    var history = await this.history('get');

    for (i in history) {
      if (history[i].name.toLowerCase() == city.toLowerCase()) {
        return true;
      }
    } // if name not in history, return false

  },
  history: async function history(x, obj) {
    if (x === 'get') {
      return await JSON.parse(localStorage.searchHistory);
    } else if (x === 'delete') {
      await localStorage.clear();
      location.reload();
    } else if (x === 'set') {
      localStorage.searchHistory = JSON.stringify(obj);
    } else if (x === 'update') {
      var data = await JSON.parse(localStorage.searchHistory);
      await data.unshift(obj);
      localStorage.searchHistory = await JSON.stringify(data);
    }
  }
};
var x = {
  init: async function init() {
    await model.init();
    await view.init();
  },
  get: async function get(x) {
    if (x === 'history') {
      return await model.get('history');
    } else if (x === 'current') {
      return await model.get('current');
    }
  },
  getCityData: async function getCityData(city) {
    return await model.findCityData(city);
  },
  clearSearch: async function clearSearch() {
    await model.history('delete');
  }
};
var view = {
  init: async function init() {
    // $('#clear').on('click',function(){ })
    this.tooltip = $('.err');
    this.width = $(window).width();
    $(window).on('resize', function () {
      if (this.width != $(window).width()) {
        this.width = $(window).width();
        view.adjust;
      }
    });
    this.cityInput = $('#cityInput');
    $('#inputButton').on('click', this.searchForTheCity);
    this.searchHistory = $('.searchHistory');
    this.searchHistory.on('click', 'button', this.searchForTheCity);
    var historyList = await x.get('history');

    for (city in historyList) {
      await this.renderHistory(historyList[city]);
    }

    await this.renderDashboard(historyList[0]);
    this.header = $('.header');
    this.bar = $('.leftSection');
    this.adjust(); //adjust the screen accordingly
  },
  renderHistory: async function renderHistory(x) {
    var temp = $('#tempSearchHistory').html();
    temp = temp.replace('{{city}}', x.name);
    this.searchHistory.prepend(temp);
  },
  renderDashboard: async function renderDashboard(x) {
    var temp = $('#tempCurrent').html();
    temp = temp.replace('{{name}}', x.name);
    temp = temp.replace('{{date}}', x.date);
    temp = temp.replace('{{icon}}', x.dataCity.weather[0].icon);
    temp = temp.replace('{{condition}}', x.dataCity.weather[0].description);
    temp = temp.replace('{{temp}}', x.dataCity.main.temp);
    temp = temp.replace('{{humid}}', x.dataCity.main.humidity);
    temp = temp.replace('{{wind}}', x.dataCity.wind.speed);
    temp = temp.replace('{{uv}}', x.dataUV.value);
    $('.cards').html(temp);
    $('.cardsFive').html(''); // set icon

    for (i in x.dataFiveDay) {
      await this.renderFiveDay(x.dataFiveDay[i][0]);
    }
  },
  renderFiveDay: async function renderFiveDay(x) {
    var temp = $('#tempFiveDay').html();
    temp = temp.replace('{{date}}', x.dt_txt.substr(0, 10));
    temp = temp.replace('{{icon}}', x.weather[0].icon);
    temp = temp.replace('{{temp}}', x.main.temp);
    temp = temp.replace('{{humid}}', x.main.humidity);
    $('.cardsFive').prepend(temp);
  },
  renderError: async function renderError(err) {
    console.log(404, err);
    this.tooltip.animate({
      'opacity': 1
    });
    setTimeout(function () {
      view.tooltip.animate({
        'opacity': 0
      });
    }, 3000);
  },
  searchForTheCity: async function searchForTheCity(e) {
    //look for the searched city
    var cityData;

    if (e.target.id === 'clear') {
      console.log('!');
      await x.clearSearch();
    } else if (e.target.classList.contains('searched')) {
      // if clicked on search History, just render from history
      //get the city dta and then render acordingly
      cityData = await x.getCityData(this.innerText);

      if (cityData[0].name.toLowerCase() === $('#city').text().toLowerCase()) {
        return;
      }
    } else {
      // if input from search bar, and if its not empty, and if its not already loaded:
      e.preventDefault();

      if (view.cityInput.val() && view.cityInput.val().trim() !== '' && view.cityInput.val().toLowerCase() !== $('#city').text().toLowerCase()) {
        cityData = await x.getCityData(view.cityInput.val().trim());
      } else {
        e.preventDefault();
        return;
      }
    }

    if (cityData === undefined) {
      cityData = await x.get('current');
      cityData = await x.getCityData(cityData);
      await view.renderDashboard((await cityData[0]));
      await view.renderHistory((await cityData[0]));
      $('#cityInput').val('');
      await view.toggle();
    } else if (cityData[1] === true) {
      await view.renderDashboard((await cityData[0]));
      await view.toggle();
    } else if (cityData[1] === false) {
      view.renderError(cityData[0]);
    }
  },
  adjust: async function adjust() {
    if ($(window).width() <= 500) {
      view.bar.animate({
        'top': -(view.bar.height() + 15)
      }); // $('.darkner').css({'opacity':0});
      // $('.darkner').css({'height' : $(window).height() + 200 +'px'})
      // $(window).on('click', function(e){
      //     if( (e.originalEvent.clientY > (view.bar.offset().top + view.bar.height() + 25)) && (view.bar.offset().top === 100) ){
      //         view.toggle()
      //     }
      // })

      view.header.click(view.toggle);
    } else {
      // view.header.unbind('click',view.toggle)
      console.log('!');
    }
  },
  toggle: async function toggle() {
    view.bar.offset().top === 100 ? view.bar.animate({
      'top': -(view.bar.height() + 15)
    }) : view.bar.animate({
      'top': -view.bar.height() + view.bar.height()
    }); // view.bar.offset().top === 100 ? $('.darkner').animate({'opacity':0}) : $('.darkner').animate({'opacity':0.70})
  }
};
x.init();