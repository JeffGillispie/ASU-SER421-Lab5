// ============================================================================
// GET REQUEST OBJECT
// ============================================================================
function getRequest() {
  if (window.XMLHttpRequest) {
    return (new XMLHttpRequest());
  } else {
    return (null);
  }
}
// ============================================================================
// SETUP HOME PAGE
// ============================================================================
function setupHomePage() {
  debugMsg("<hr /><h3>Debug Messages</h3>");
  var req = getRequest();
  req.onreadystatechange = function() {
    if ((req.readyState == 4) && (req.status == 200)) {
      document.getElementById("sectionTable").innerHTML = req.responseText;
      getStoredData(function(data) {
        for (index in data) {
          var city = data[index];
          insertCityRow(city);
        }
        writeSummaryData();
      });
    }
  };
  req.open("GET", "weatherTable.html", true);
  req.send(null);
}
// ============================================================================
// DEBUG MESSAGE
// ============================================================================
function debugMsg(msg) {
  document.getElementById("sectionMessages").innerHTML += "<br />" + msg;
}
// ============================================================================
// WRITE SUMMARY DATA
// ============================================================================
function writeSummaryData() {
  getSummaryData(function(summaryData) {
    var tempInfo = '{0}{1}'.format(
      'Average temperature is {0} '.format(summaryData.avgTemp),
      'and the hottest city is {0}'.format(summaryData.highestTemp)
    );
    var humidityInfo = '{0}{1}'.format(
      'Average humidity is {0} '.format(summaryData.avgHumidity),
      'and the most humid city is {0}.'.format(summaryData.highestHumidity)
    );
    var bestInfo = 'The city with the nicest weather is {0}.'
      .format(summaryData.bestWeather);
    var worstInfo = 'The city with the worst weather is {0}.'
      .format(summaryData.worstWeather);
    document.getElementById("sectionTemp").innerHTML = tempInfo;
    document.getElementById("sectionHumidity").innerHTML = humidityInfo;
    document.getElementById("sectionBestCity").innerHTML = bestInfo;
    document.getElementById("sectionWorstCity").innerHTML = worstInfo;
  });
}
// ============================================================================
// GET STORED DATA
// ============================================================================
function getStoredData(callback) {
  var cityData = JSON.parse(localStorage.getItem('cities'));
  var promises = [];
  var exists = true;
  if (!cityData) {
    exists = false;
    promises.push(new Promise((resolve, reject) => {
      getRefreshData(function(refreshData) {
        cityData = refreshData;
        resolve();
      });
    }));
  }
  Promise.all(promises).then(() => {
    if (!exists) {
      localStorage.setItem('cities', JSON.stringify(cityData));
    }
    callback(cityData);
  });
}
// ============================================================================
// GET REFRESH DATA
// ============================================================================
function getRefreshData(callback) {
  debugMsg('starting get refresh data');
  var cityData = [];
  var promises = [];
  promises.push(new Promise((resolve, reject) => {
    debugMsg('london');
    getWeatherData('London', function(info) {
      cityData.push(info);
      resolve();
    });
  }));
  promises.push(new Promise((resolve, reject) => {
    debugMsg('phoenix');
    getWeatherData('Phoenix', function(info) {
      cityData.push(info);
      resolve();
    });
  }));
  Promise.all(promises).then(() => {
    debugMsg('finishing get refresh data');
    callback(cityData);
  });
}
// ============================================================================
// RESET DATA STORE
// ============================================================================
function resetDataStore(callback) {
  getStoredData(function(dataStore) {
    var newStore = [];
    for(var i = 0; i < dataStore.length; i++) {
      if (dataStore[i].city == 'Phoenix' || dataStore[i].city == 'London') {
        newStore.push(dataStore[i]);
      }
    }
    localStorage.setItem('cities', JSON.stringify(newStore));
    callback();
  });
}
// ============================================================================
// SELECTION CHANGED
// ============================================================================
function selectionChanged() {
  var req = getRequest();
  req.onreadystatechange = function() {
    if ((req.readyState == 4) && (req.status == 200)) {
      resetDataStore(function() {
        getStoredData(function(dataStore) {
          document.getElementById("sectionTable").innerHTML = req.responseText;
          var newCity = document.getElementById("selector").value;
          debugMsg(newCity);
          getWeatherData(newCity, function(info) {
            dataStore.push(info);
            localStorage.setItem('cities', JSON.stringify(dataStore));
            for (index in dataStore) {
              var city = dataStore[index];
              insertCityRow(city);
            }
            writeSummaryData();
          });
        });
      });
    }
  };
  req.open("GET", "weatherTable.html", true);
  req.send(null);
  return false;
}
// ============================================================================
// REFRESH BUTTON CLICKED
// ============================================================================
function refreshButtonClicked() {
  debugMsg('button clicked');
  var req = getRequest();
  req.onreadystatechange = function() {
    if ((req.readyState == 4) && (req.status == 200)) {
      document.getElementById("sectionTable").innerHTML = req.responseText;
      getStoredData(function(dataStore) {
        getRefreshData(function(refreshData) {
          var updatedData = [];
          var newStore = [];
          for(var i = 0; i < refreshData.length; i++) {
              var refItem = refreshData[i];
              newStore.push(refItem);
              updatedData.push(refItem);
              var strItem = getMatch(refItem.city, dataStore);
              if (strItem) {
                var diff = getDifferenceItem(strItem, refItem);
                updatedData.push(diff);
              }
          }
          debugMsg('newstore: ' + JSON.stringify(newStore));
          localStorage.setItem('cities', JSON.stringify(newStore));
          for (i in updatedData) {
            var city = updatedData[i];
            insertCityRow(city);
          }
        });
      });
    }
  };
  req.open("GET", "weatherTable.html", true);
  req.send(null);
  return false;
}
// ============================================================================
// GET MATCH
// ============================================================================
function getMatch(refCity, strData) {
  var match = null;
  for (var i = 0; i < strData.length; i++) {
    var strItem = strData[i];
    if (refCity == strItem.city) {
      match = strItem;
      break;
    }
  }
  return match;
}
// ============================================================================
// GET DIFFERENCE TIME
// ============================================================================
function getDifferenceTime(t1, t2) {
  debugMsg('get diff time');
  var d1 = new Date(t1);
  var d2 = new Date(t2);
  var timeDiff = Math.abs(d2.getTime() - d1.getTime());
  var diffMin = Math.ceil(timeDiff / (1000 * 60));
  return '{0} minutes ago'.format(diffMin);
}
// ============================================================================
// GET DIFFERENCE ITEM
// ============================================================================
function getDifferenceItem(orig, update) {
  var item = {
    "city": orig.city,
    "timestamp": getDifferenceTime(orig.date, update.date),
    "temp": (orig.temp - update.temp).toFixed(2),
    "humidity": (orig.humidity - update.humidity).toFixed(2),
    "windspeed": (orig.windspeed - update.windspeed).toFixed(2),
    "cloudiness": (orig.cloudiness - update.cloudiness).toFixed(2)
  };
  return item;
}
// ============================================================================
// ADD CITY TO STORAGE
// ============================================================================
function addCityToStorage(weatherInfo) {
  var cities = JSON.parse(sessionStorage.getItem('cities'));
  var exists = false;
  for (cityIdx in cities) {
    if (cities[cityIdx].city == weatherInfo.city) {
      exists = true;
      break;
    }
  }
  if (!exists) {
    cities.push(weatherInfo);
    sessionStorage.setItem('cities', JSON.stringify(cities));
  }
}
// ============================================================================
// GET AVERAGE VALUE
// ============================================================================
function getAverageValue(field, callback) {
  getStoredData(function(cities) {
    var totalValue = 0;
    var totalCount = 0;
    for (cityIdx in cities) {
      var info = cities[cityIdx];
      totalValue += parseFloat(info[field]);
      totalCount += 1;
    }
    var avg = totalValue / totalCount;
    callback(avg.toFixed(2));
  });
}
// ============================================================================
// GET CITY WITH HIGHEST VALUE
// ============================================================================
function getCityWithHighestValue(field, callback) {
  getStoredData(function(cities) {
    var highestValue = parseFloat(cities[0][field]);
    var highestCity = cities[0].city;
    for (cityIdx in cities) {
      var info = cities[cityIdx];
      var currentValue = parseFloat(info[field])
      if (currentValue > highestValue) {
        highestValue = currentValue;
        highestCity = info.city;
      }
    }
    callback(highestCity);
  });
}
// ============================================================================
// GET BEST WEATHER
// ============================================================================
function getBestWeather(callback) {

  getStoredData(function(cities) {
    var best = cities[0].city;

    var value = cities[0].temp +
      cities[0].humidity +
      cities[0].windspeed +
      cities[0].cloudiness;
    for (var i = 1; i < cities.length; i++) {
      var x = cities[i];
      var current = x.temp + x.humidity + x.windspeed + x.cloudiness;
      if (current < value) {
        best = x.city;
      }
    }
    callback(best);
  });
}
// ============================================================================
// GET WORST WEATHER
// ============================================================================
function getWorstWeather(callback) {

  getStoredData(function(cities) {
    var worst = cities[0].city;
    var value = cities[0].temp +
      cities[0].humidity +
      cities[0].windspeed +
      cities[0].cloudiness;
    for (var i = 1; i < cities.length; i++) {
      var x = cities[i];
      var current = x.temp + x.humidity + x.windspeed + x.cloudiness;
      if (current > value) {
        worst = x.city;
      }
    }
    callback(worst);
  });
}
// ============================================================================
// GET SUMMARY DATA
// ============================================================================
function getSummaryData(callback) {
  getAverageValue('temp', function(temp) {
    getAverageValue('humidity', function(humidity) {
      getCityWithHighestValue('temp', function(highTemp) {
        getCityWithHighestValue('humidity', function(highHumidity) {
          getBestWeather(function(bestWeather) {
            getWorstWeather(function(worstWeather) {
              var data = {
                "avgTemp": temp,
                "avgHumidity": humidity,
                "highestTemp": highTemp,
                "highestHumidity": highHumidity,
                "bestWeather": bestWeather,
                "worstWeather": worstWeather
              }
              callback(data);
            });
          });
        });
      });
    });
  });
}
// ============================================================================
// INSERT CITY ROW
// ============================================================================
function insertCityRow(cityInfo) {
  debugMsg('insert city row');
  var body = document.getElementById('dataTable')
    .getElementsByTagName('tbody')[0];
  var row = body.insertRow(body.rows.length);
  addCellToRow(row, 0, cityInfo.city);
  addCellToRow(row, 1, cityInfo.timestamp);
  addCellToRow(row, 2, cityInfo.temp);
  addCellToRow(row, 3, cityInfo.humidity);
  addCellToRow(row, 4, cityInfo.windspeed);
  addCellToRow(row, 5, cityInfo.cloudiness);
}
// ============================================================================
// ADD CELL TO ROW
// ============================================================================
function addCellToRow(row, index, value) {
  var cell = row.insertCell(index);
  var value = document.createTextNode(value);
  cell.appendChild(value);
}
// ============================================================================
// KELVIN TO CELSIUS
// ============================================================================
function kelvinToCelsius(kelvins) {
  return (kelvins - 273.15).toFixed(2);
}
// ============================================================================
// GET WEATHER DATA
// ============================================================================
function getWeatherData(city, callback) {
  var req = getRequest();
  req.onreadystatechange = function() {
    if ((req.readyState == 4) && (req.status == 200)) {
      var data = JSON.parse(req.responseText);
      var info = {
        "city": city,
        "timestamp": getFormattedDate(data.dt),
        "date": new Date(parseInt(data.dt) * 1000),
        "temp": kelvinToCelsius(data.main.temp),
        "humidity": data.main.humidity,
        "windspeed": data.wind.speed,
        "cloudiness": data.clouds.all
      };
      callback(info);
    }
  };
  req.open("POST", "index.html", true);
  req.send('city={0}'.format(city));
}
// ============================================================================
// GET FORMATTED DATE
// ============================================================================
function getFormattedDate(str) {
  var date = new Date(parseInt(str) * 1000);
  var result = '{0}:{1}:{2}:{3}:{4}:{5}'.format(
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    date.getHours(),
    date.getMinutes(),
    date.getSeconds()
  );
  debugMsg(result);
  return result;
}
// ============================================================================
// FORMAT EXTENSION
// ============================================================================
String.prototype.format = function() {
  var args = [].slice.call(arguments);
  return this.replace(/(\{\d+\})/g, function (a) {
    return args[+(a.substr(1, a.length - 2))|0];
  });
}
