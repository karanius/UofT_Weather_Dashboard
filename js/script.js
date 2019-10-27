$('#colorPic').on('input', function(){
    console.log(this.value)
})


$('button').on('click', function(e){
    e.preventDefault()
})

// var aa = [
    // {"data":{"currentCity":{"name":"Toronto","temp":281.58,"humid":70,"windSpeed":4.1,"lon":-79.39,"lat":43.65,"UV":2.78,"fiveDay":[[{"temp":282.67,"temp_min":281.92,"temp_max":282.67,"pressure":1024,"sea_level":1024,"grnd_level":1014,"humidity":60,"temp_kf":0.75},{"id":804,"main":"Clouds","description":"overcast clouds","icon":"04d"}],[{"temp":287.5,"temp_min":287.5,"temp_max":287.5,"pressure":1001,"sea_level":1001,"grnd_level":991,"humidity":81,"temp_kf":0},{"id":500,"main":"Rain","description":"light rain","icon":"10d"}],[{"temp":284.16,"temp_min":284.16,"temp_max":284.16,"pressure":1020,"sea_level":1020,"grnd_level":1010,"humidity":60,"temp_kf":0},{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],[{"temp":287.03,"temp_min":287.03,"temp_max":287.03,"pressure":1015,"sea_level":1015,"grnd_level":1006,"humidity":83,"temp_kf":0},{"id":800,"main":"Clear","description":"clear sky","icon":"01d"}],[{"temp":280.78,"temp_min":280.78,"temp_max":280.78,"pressure":1029,"sea_level":1029,"grnd_level":1019,"humidity":59,"temp_kf":0},{"id":803,"main":"Clouds","description":"broken clouds","icon":"04d"}]]},"searchHistory":[]}}
// ] ;

var model = {
    data: {
        currentCity: {
            name: '',
            dt:'',
            temp: '',
            humid: '',
            windSpeed: '',
            lon:'',
            lat:'',
            UV: '',
            fiveDay:''
        },
    },
    init:function(){
        // if there is data in local storage, then u dont need to do anythin
        if (localStorage.searchHistory){
            return '!';
        } else{
            //else, if there is no data, call for it using ajax, and then build local storage data
            this.call('toronto')
        }
    },
    // updateCurrentCity:function(){
    //                 // ????? do i need this function
    // },
    call:function(city){ 
        // if in local storage, render visual from localstorage,
        // else do api call, grab data, save data in local storage, render view, render seaerch history
        const apiKey ='39de57d592095bbfe9e8021be543027b';
        let urlCity = `http://api.openweathermap.org/data/2.5/weather?q=${city}&APPID=${apiKey}`;
        let fiveDay = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&APPID=${apiKey}`;
        let dt = new Date();
        function ajax1(d){
            $.ajax({method:"GET",url:urlCity,success:function(e){
                model.data.currentCity.dt = d.getDate()+'/'+d.getMonth()+'/'+d.getFullYear()
                model.data.currentCity.name = e.name;
                model.data.currentCity.temp = e.main.temp;
                model.data.currentCity.humid = e.main.humidity;
                model.data.currentCity.windSpeed = e.wind.speed;
                model.data.currentCity.lon = e.coord.lon;
                model.data.currentCity.lat = e.coord.lat;
                let urlUV =  `http://api.openweathermap.org/data/2.5/uvi/forecast?appid=${apiKey}&lat=${e.coord.lat}&lon=${e.coord.lon}&cnt=1`
                $.ajax({method:"GET",url:urlUV,success:function(e){
                    model.data.currentCity.UV = e[0].value
                }})
            }})
        }
        
        function ajax2(){
            $.ajax({method:"GET",url:fiveDay,success:function(e){
                console.log(e)
                model.data.currentCity.fiveDay = [[e.list[0]], [e.list[8]], [e.list[16]], [e.list[24]],[e.list[32]]];
            }});
        }

        $.when(ajax1(dt),ajax2()).done(function(){setTimeout(()=>{model.updateSearchHistory('init')},1000)});
    },
    updateSearchHistory:function(x){
        //if there is no local storage build it
        if (x==='init'){
            localStorage.searchHistory = JSON.stringify([model.data.currentCity])
        } else{
            // else, just update it
            let objs = JSON.parse(localStorage.searchHistory)
            objs.push(model.data.currentCity);
            localStorage.searchHistory =  JSON.stringify(objs)
        };
    },
    get:function(x){
        if ((x==='history') && (localStorage.searchHistory) ){
            return JSON.parse(localStorage.searchHistory)
        } else if ((x==='history') && (!localStorage.searchHistory)){
            var x;
            $.when(model.call('toronto')).done(function(){ x = model.data.currentCity});
            return x
        }                                  

        if (x === 'current'){
            return model.data.currentCity;
        }
    }
}

var x = {
    init:function(){
        let x = model.init()
        if (x==='!'){
            view.init()
        }else(
            setTimeout(()=>{view.init()},2000)
        )
    },
    get:function(x){
        if (x === 'history'){
            return model.get('history')
        } else if (x === 'current'){
            return model.get('current')
        }
    }
};

var view = {
    init:function(){
        this.searchHistory = $('.searchHistory');
        let historyList = x.get('history')
        for (city in historyList){
            this.renderHisttory(historyList[city])
        }
        this.renderDashboard(historyList[0])
    },
    renderHisttory:function(x){
        let temp = $('#tempSearchHistory').html();
        temp = temp.replace('{{city}}',x.name);
        this.searchHistory.append(temp);
    },
    renderDashboard:function(x){
        let temp = $('#tempCurrent').html()
        temp = temp.replace('{{name}}',x.name);
        temp = temp.replace('{{date}}',x.dt);
        // temp = temp.replace('{{logo}}',x.logo);
        temp = temp.replace('{{temp}}',x.temp);
        temp = temp.replace('{{humid}}',x.humid);
        temp = temp.replace('{{wind}}',x.windSpeed);
        temp = temp.replace('{{uv}}',x.UV);
        $('.cards').html(temp)
        for (i in x.fiveDay){
            this.renderFiveDay(x.fiveDay[i])
            console.log(x.fiveDay)
        }
    },
    renderFiveDay:function(x){
        let temp = $('#tempFiveDay').html()
        temp = temp.replace('{{date}}',x[0].dt_txt.substr(0,10))
        // temp = temp.replace('{{logo}}')
        temp = temp.replace('{{temp}}',x[0].main.temp)
        temp = temp.replace('{{humid}}',x[0].main.humidity)
        $('.cardsFive').append(temp)
    }
}

x.init();





