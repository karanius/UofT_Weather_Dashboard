var model = {
    data:{
        currentCity: ''
    },
    init:async function (){
        let time = new Date();
        this.today = time.getDate()+'/'+time.getMonth()+'/'+time.getFullYear()
        let goodData=[]
        if (localStorage.searchHistory){ // if there is data in local storage, make sure its up-to-date
            let history = await this.history('get')
            for (city in history){
                if (history[city].date === this.today){
                    goodData.push(true)
                }else{
                    goodData.push(false);
                }
            }
            if (goodData.includes(false)){ //if not up-to-date, then update it
                await this.history('delete')
                await this.call('toronto')
            } else {
                return '!' // if its up-to-date, then dont need to do anything
            }
        } else{
            await this.call('toronto') //else, if there is no data, call for it using ajax, and then build local storage data
        }
    },
    call:async function(city){ 
        city = city.toLowerCase()
        if (city.includes(' ')){
            city.replace(' ','+')
        }
        try{
            // grab data through api call, save data in local storage, and update current city
            const apiKey ='9710213fc0f3cccc6f013963f9a76866';
            let urlCity = `http://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&APPID=${apiKey}`;
            let fiveDay = `http://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&APPID=${apiKey}`;
            let cityData = await fetch(urlCity)
            cityData = await cityData.json(); //!!!!!!!!!!!!!!! this is the searched city data
            let urlUV = `http://api.openweathermap.org/data/2.5/uvi/forecast?appid=${apiKey}&lat=${cityData.coord.lat}&lon=${cityData.coord.lon}&cnt=1`
            let uvData = await fetch(urlUV);
            uvData = await uvData.json();
            uvData = uvData[0] // !!!!!!!!!!!!! this is the uv index for the current city
            let fiveDayData = await fetch(fiveDay); 
            fiveDayData = await fiveDayData.json()
            // below is the 5 day data
            fiveDayData = [[fiveDayData.list[0]], [fiveDayData.list[8]], [fiveDayData.list[16]], [fiveDayData.list[24]],[fiveDayData.list[32]]];
            //update current city, update localStorage.searchHistory,
            await this.upddateCurrentCity(cityData),
            await this.updateLocalStorage(cityData,uvData,fiveDayData)
        }
        catch(err){
            return (['Please Check The City Name Which Was Entered',false])
        }
       
    },
    upddateCurrentCity: async function(city){
        model.data.currentCity = city.name
    },
    updateLocalStorage:async function(cityData,uvData,fiveDayData){
        let d = new Date();
        let dataObj = { //construct the new data set for the newly searched city
            name:cityData.name,
            date:d.getDate()+'/'+d.getMonth()+'/'+d.getFullYear(),
            dataCity:cityData,
            dataUV:uvData,
            dataFiveDay:fiveDayData,
        }
        if (!localStorage.searchHistory){ // create search history if non existant
            // await this.history('set',[dataObj])
            localStorage.searchHistory=JSON.stringify([dataObj])
        } else{ //else, just add and update it
            let data = JSON.parse(localStorage.searchHistory);
            data.unshift(dataObj)
            localStorage.searchHistory=JSON.stringify(data)
        }
    },
    get:async function(x){
        if ((x==='history') && (localStorage.searchHistory) ){
            return await JSON.parse(localStorage.searchHistory)
        }  else if (x === 'current'){
            return await model.data.currentCity
        } else {
            let history = await this.history('get')
            for (i in history){
                if (history[i].name.toLowerCase() === x.toLowerCase()){
                    return history[i]
                }
            }
        }
    },
    findCityData:async function(city){
        if (await this.isInSearchHistory(city)){ //if city is alredy in history, send it back to be rendered
            let data = await this.get(city)
            return [data,true]
        } else{
            let data = await this.call(city);
            return data
        }
    //     let serchHistory = JSON.parse(localStorage.searchHistory);
    //     for (city in serchHistory){
    //         if (serchHistory[city].name.toLowerCase() === x.toLowerCase()){
    //             console.log(serchHistory[city])
    //         }else{
    //             this.call(x)
    //             setTimeout(()=>{model.updateSearchHistory('!')},1000);
    //         }
        // }
    },
    isInSearchHistory:async function(city){
        let history = await this.history('get')
        for ( i in history){
            if (history[i].name.toLowerCase() == city.toLowerCase()){
                return true
            }
        } // if name not in history, return false
    },
    history:async function(x){
        if (x==='get'){
            return await JSON.parse(localStorage.searchHistory)
        } else if (x==='delet'){
            await localStorage.clear()
        } 
    },
}

var x = {
    init: async function(){
        await model.init()
        await view.init()
    },
    get:async function(x){
        if (x === 'history'){
            return await model.get('history')
        } else if (x === 'current'){
            return await model.get('current')
        }
    },
    getCityData:async function(city){
        return await model.findCityData(city);
    }
};

var view = {
    init:async function(){
        this.cityInput =$('#cityInput');
        $('#inputButton').on('click',this.searchForTheCity);
        $('.searchHistory').on('click','button',this.searchForTheCity);
        this.header = $('.header');
        this.bar = $('.leftSection');
        this.header.on('click',this.toggle);
        this.searchHistory = $('.searchHistory');
        let historyList = await x.get('history')
        for (city in historyList){
            await this.renderHistory(historyList[city])
        }
        await this.renderDashboard(historyList[0]);
    },
    renderHistory:async function(x){
        let temp = $('#tempSearchHistory').html();
        temp = temp.replace('{{city}}',x.name);
        this.searchHistory.prepend(temp);
    },
    renderDashboard:async function(x){
        let temp = $('#tempCurrent').html()
        temp = temp.replace('{{name}}',x.name);
        temp = temp.replace('{{date}}',x.date);
        temp = temp.replace('{{icon}}',x.dataCity.weather[0].icon)
        temp = temp.replace('{{condition}}',x.dataCity.weather[0].description)
        temp = temp.replace('{{temp}}',x.dataCity.main.temp);
        temp = temp.replace('{{humid}}',x.dataCity.main.humidity);
        temp = temp.replace('{{wind}}',x.dataCity.wind.speed);
        temp = temp.replace('{{uv}}',x.dataUV.value);
        $('.cards').html(temp)
        $('.cardsFive').html('')
        // set icon
        for (i in x.dataFiveDay){
           await this.renderFiveDay(x.dataFiveDay[i][0])
        }
    },
    renderFiveDay:async function(x){
        let temp = $('#tempFiveDay').html()
        temp = temp.replace('{{date}}',x.dt_txt.substr(0,10))
        temp = temp.replace('{{icon}}',x.weather[0].icon)
        temp = temp.replace('{{temp}}',x.main.temp)
        temp = temp.replace('{{humid}}',x.main.humidity)
        $('.cardsFive').prepend(temp)
    },
    searchForTheCity:async function(e){ //look for the searched city
        let cityData;
        if (e.target.classList.contains('searched')){ // if clicked on search History, just render from history
        //get the city dta and then render acordingly
            cityData = await x.getCityData(this.innerText);
            if (cityData[0].name.toLowerCase() === $('#city').text().toLowerCase()){
                return
            }
        }else{ // if input from search bar, and if its not empty, and if its not already loaded:
            e.preventDefault()
            if (view.cityInput.val() && (view.cityInput.val().trim() !== '' ) && (view.cityInput.val().toLowerCase() !== $('#city').text().toLowerCase()) ){
                debugger
                cityData = await x.getCityData(view.cityInput.val());
            }
        }
        
        
        if (cityData === undefined){
            await view.renderDashboard( await x.getCityData(x.get('current')) )
        } else if (cityData[1] === true){
            await view.renderDashboard( await cityData[0])
        }

    }
}


        

        
        
    //         //get the city dta and then render acordingly
    
    //         console.log(cityData)
    //     }else{
    //         e.preventDefault()
    //         return;
    //     }   
    // }
    // if(cityData===false){
    //     console.log('SHHHHEEIIIT')
    // }else if (cityData === undefined) {
    //     // view.renderDashboard()
    // }
    // }
    
    //             !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    //         if (cityData[0].name.toLowerCase() === $('#city').text().toLowerCase()){
    //             return
    //         }
    //         if (cityData[1] === true){
    //             await view.renderDashboard(cityData[0]);
    //             return;
    //         }
    //         // $('.searchHistory').html('')
    //         let historyList = await x.get('history')
    //         for (city in historyList){
    //             await view.renderHistory(historyList[city])
    //         }
    //     toggle:function(){
    //         if (window.innerWidth <= 377){
    //             view.bar.offset().top === 100 ? $('.leftSection').animate({'top': '-'+$('.leftSection').height()}) : $('.leftSection').animate({'top':'0px'})
    //         }
    //     },
    









x.init();